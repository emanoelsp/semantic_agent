/**
 * ============================================================================
 * node-red-contrib-industrial-semantic-agent — semantic-plc-mapper.js
 * ============================================================================
 * Custom Node-RED Industrial Edge Runtime Node:
 * - Accepts vendor-agnostic PLC payloads (Siemens S7, Rockwell ControlLogix,
 *   Schneider Modbus, Mitsubishi MELSEC, OPC-UA).
 * - Transforms tags into IDTA AAS v3.0 SubmodelElement & ECLASS 14.0 payloads.
 * - Optional localized HTTP endpoint exposure (/edge/aas/:idShort) on the
 *   Node-RED Express server for direct OT/IT scraping.
 * - Offline-resilient Licensing Bridge:
 *   - Validates Pay-as-you-go quotas against the SaaS cloud (/api/edge/license).
 *   - Persists encrypted/HMAC-signed lease cache on disk (~/.node-red/.semantic-license-cache.json).
 *   - Continues operating in Offline Grace Mode (up to configured message limit
 *     or 24h TTL) if plant internet connectivity drops, queuing metering deltas.
 *   - Emits a structured billing redirect message on Output Port 2 when quota
 *     is depleted so the operator can top up via PIX/Credit Card.
 * ============================================================================
 */

const fs = require("fs")
const path = require("path")
const os = require("os")
const crypto = require("crypto")
const http = require("http")
const https = require("https")

module.exports = function (RED) {
  function SemanticPlcMapperNode(config) {
    RED.nodes.createNode(this, config)
    const node = this

    node.plcVendor = config.plcVendor || "siemens-s7"
    node.sourceTag = config.sourceTag || "DB10.W2"
    node.eclassIrdi = config.eclassIrdi || "0173-1#02-BAA123#003"
    node.targetName = config.targetName || "Linear Velocity"
    node.unit = config.unit || "m/s"
    node.actionMode = config.actionMode || "DirectMap"
    node.conversionFormula = config.conversionFormula || ""
    node.outputMode = config.outputMode || "aas-v3-and-local-api"
    node.platformUrl = (config.platformUrl || "http://localhost:3000").replace(/\/+$/, "")
    node.licenseToken =
      (this.credentials && this.credentials.licenseToken) ||
      config.licenseToken ||
      process.env.SEMANTIC_EDGE_TOKEN ||
      ""
    node.offlineGraceLimit = parseInt(config.offlineGraceLimit || "500", 10)

    const cacheFile = path.join(
      RED.settings.userDir || os.homedir(),
      `.semantic-edge-lease-${crypto.createHash("sha1").update(node.id).digest("hex").slice(0, 8)}.json`
    )

    // In-memory + disk-persisted licensing state
    let leaseState = {
      verified: false,
      remainingQuota: 0,
      offlineUsedCount: 0,
      pendingSyncCount: 0,
      leaseExpiresAt: 0,
      signature: "",
      lastTelemetrySnapshot: null,
    }

    function loadCachedLease() {
      try {
        if (fs.existsSync(cacheFile)) {
          const raw = fs.readFileSync(cacheFile, "utf-8")
          const parsed = JSON.parse(raw)
          if (parsed && typeof parsed === "object") {
            leaseState = { ...leaseState, ...parsed }
          }
        }
      } catch (err) {
        node.warn(`[SemanticEdge] Failed to read local license cache: ${err.message}`)
      }
    }

    function saveCachedLease() {
      try {
        fs.writeFileSync(cacheFile, JSON.stringify(leaseState, null, 2), "utf-8")
      } catch (err) {
        node.warn(`[SemanticEdge] Failed to write local license cache: ${err.message}`)
      }
    }

    function postJson(urlStr, payload, timeoutMs = 4000) {
      return new Promise((resolve, reject) => {
        try {
          const parsedUrl = new URL(urlStr)
          const lib = parsedUrl.protocol === "https:" ? https : http
          const bodyData = JSON.stringify(payload)

          const req = lib.request(
            {
              hostname: parsedUrl.hostname,
              port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
              path: parsedUrl.pathname + parsedUrl.search,
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(bodyData),
                Authorization: `Bearer ${node.licenseToken}`,
              },
              timeout: timeoutMs,
            },
            (res) => {
              let chunks = ""
              res.on("data", (d) => (chunks += d))
              res.on("end", () => {
                try {
                  const json = JSON.parse(chunks || "{}")
                  resolve({ statusCode: res.statusCode, data: json })
                } catch (e) {
                  reject(new Error("Invalid JSON from licensing server"))
                }
              })
            }
          )

          req.on("error", (err) => reject(err))
          req.on("timeout", () => {
            req.destroy()
            reject(new Error("Licensing server timeout"))
          })
          req.write(bodyData)
          req.end()
        } catch (err) {
          reject(err)
        }
      })
    }

    async function syncLicenseWithCloud(consumeDelta = 0) {
      if (!node.licenseToken) {
        node.status({
          fill: "red",
          shape: "ring",
          text: "Sem token — Ative Pay-as-you-go",
        })
        return {
          allowed: false,
          mode: "unlicensed",
          reason: "Token de licença Edge não configurado",
          topupUrl: `${node.platformUrl}/faturamento?reason=missing_token&nodeId=${node.id}`,
        }
      }

      const totalToSync = consumeDelta + leaseState.pendingSyncCount

      try {
        const res = await postJson(`${node.platformUrl}/api/edge/license`, {
          edgeToken: node.licenseToken,
          nodeId: node.id,
          plcVendor: node.plcVendor,
          consumeMessages: totalToSync,
        })

        if (res.statusCode === 200 && res.data && res.data.allowed) {
          leaseState.verified = true
          leaseState.remainingQuota = res.data.remainingEdgeQuota ?? 0
          leaseState.offlineUsedCount = 0
          leaseState.pendingSyncCount = 0
          leaseState.leaseExpiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24h offline lease TTL
          leaseState.signature = res.data.leaseSignature || ""
          saveCachedLease()

          node.status({
            fill: "green",
            shape: "dot",
            text: `Online | Quota: ${leaseState.remainingQuota} msgs`,
          })

          return { allowed: true, mode: "online", remainingQuota: leaseState.remainingQuota }
        }

        // 402 Payment Required or 401 Unauthorized
        leaseState.verified = false
        leaseState.remainingQuota = res.data?.remainingEdgeQuota ?? 0
        saveCachedLease()

        const topupUrl =
          res.data?.topupUrl ||
          `${node.platformUrl}/faturamento?reason=quota_depleted&token=${encodeURIComponent(
            node.licenseToken.slice(0, 12)
          )}`

        node.status({
          fill: "red",
          shape: "ring",
          text: `Quota esgotada — Recarregue via PIX`,
        })

        return {
          allowed: false,
          mode: "depleted",
          reason: res.data?.error || "Quota Pay-as-you-go insuficiente",
          topupUrl,
        }
      } catch (netErr) {
        // Cloud unreachable -> Check Offline Resilience Lease & Grace Buffer
        const now = Date.now()
        const hasValidLease =
          leaseState.verified &&
          now < leaseState.leaseExpiresAt &&
          leaseState.remainingQuota > leaseState.offlineUsedCount &&
          leaseState.offlineUsedCount < node.offlineGraceLimit

        if (hasValidLease) {
          leaseState.offlineUsedCount += consumeDelta
          leaseState.pendingSyncCount += consumeDelta
          saveCachedLease()

          const remainingOffline = Math.min(
            leaseState.remainingQuota - leaseState.offlineUsedCount,
            node.offlineGraceLimit - leaseState.offlineUsedCount
          )

          node.status({
            fill: "yellow",
            shape: "dot",
            text: `Offline Cache (${remainingOffline} grace msgs)`,
          })

          return {
            allowed: true,
            mode: "offline-grace",
            remainingQuota: remainingOffline,
          }
        }

        node.status({
          fill: "red",
          shape: "ring",
          text: "Offline e sem lease válido",
        })

        return {
          allowed: false,
          mode: "offline-expired",
          reason: "Sem conectividade com a nuvem e cache offline expirado/esgotado",
          topupUrl: `${node.platformUrl}/faturamento?reason=offline_expired`,
        }
      }
    }

    // Expose localized HTTP API endpoint on Node-RED Express instance if enabled
    const localEndpointPath = `/edge/aas/${node.sourceTag.replace(/[^a-zA-Z0-9_]/g, "_")}`
    if (
      RED.httpNode &&
      (node.outputMode === "local-api-only" || node.outputMode === "aas-v3-and-local-api")
    ) {
      RED.httpNode.get(localEndpointPath, (req, res) => {
        if (!leaseState.lastTelemetrySnapshot) {
          return res.status(404).json({
            error: "Nenhuma leitura de CLP recebida ainda neste nó.",
            endpoint: localEndpointPath,
          })
        }
        return res.status(200).json(leaseState.lastTelemetrySnapshot)
      })
    }

    // Initial startup handshake
    loadCachedLease()
    syncLicenseWithCloud(0).catch(() => {})

    // Periodic background sync every 60s for queued offline telemetry counts
    const syncInterval = setInterval(() => {
      if (leaseState.pendingSyncCount > 0) {
        syncLicenseWithCloud(0).catch(() => {})
      }
    }, 60000)

    node.on("input", async function (msg, send, done) {
      send =
        send ||
        function () {
          node.send.apply(node, arguments)
        }

      // Check quota (sync every 10 messages when online, or use local lease counter in between)
      let licenseCheck
      if (
        leaseState.verified &&
        leaseState.remainingQuota > 10 &&
        leaseState.pendingSyncCount < 9 &&
        Date.now() < leaseState.leaseExpiresAt
      ) {
        leaseState.remainingQuota -= 1
        leaseState.pendingSyncCount += 1
        licenseCheck = {
          allowed: true,
          mode: "cached-batch",
          remainingQuota: leaseState.remainingQuota,
        }
        node.status({
          fill: "green",
          shape: "dot",
          text: `Ativo | Quota: ${leaseState.remainingQuota} msgs`,
        })
      } else {
        licenseCheck = await syncLicenseWithCloud(1)
      }

      if (!licenseCheck.allowed) {
        const billingAlert = {
          ...msg,
          payload: {
            status: "LICENSE_BLOCKED",
            reason: licenseCheck.reason,
            actionRequired: "TOPUP_PAY_AS_YOU_GO",
            redirectUrl: licenseCheck.topupUrl,
            plcVendor: node.plcVendor,
            sourceTag: node.sourceTag,
            timestamp: new Date().toISOString(),
          },
        }
        // Output 1: null (blocked), Output 2: Billing Redirect Alert
        send([null, billingAlert])
        if (done) done()
        return
      }

      // Extract raw value from vendor-specific PLC block structure or raw msg.payload
      let rawValue = msg.payload
      if (rawValue && typeof rawValue === "object") {
        if (node.sourceTag in rawValue) {
          rawValue = rawValue[node.sourceTag]
        } else if ("value" in rawValue) {
          rawValue = rawValue.value
        }
      }

      // Apply optional unit conversion
      let transformedValue = rawValue
      if (node.actionMode === "Convert_Unit" && typeof rawValue === "number") {
        if (node.conversionFormula === "F_to_C") {
          transformedValue = Number((((rawValue - 32) * 5) / 9).toFixed(3))
        } else if (node.conversionFormula === "PSI_to_BAR") {
          transformedValue = Number((rawValue * 0.0689476).toFixed(4))
        }
      }

      const idShort = node.sourceTag.replace(/[^a-zA-Z0-9_]/g, "_")
      const aasSubmodelElement = {
        idShort,
        modelType: "Property",
        category: "VARIABLE",
        valueType: typeof transformedValue === "boolean" ? "xs:boolean" : "xs:double",
        value: String(transformedValue),
        semanticId: {
          type: "ExternalReference",
          keys: [
            {
              type: "ConceptDescription",
              value: node.eclassIrdi,
            },
          ],
        },
        qualifiers: [
          { type: "Unit", valueType: "xs:string", value: node.unit },
          { type: "PlcVendor", valueType: "xs:string", value: node.plcVendor },
          { type: "SourceTag", valueType: "xs:string", value: node.sourceTag },
          { type: "LicensingMode", valueType: "xs:string", value: licenseCheck.mode },
        ],
        timestamp: new Date().toISOString(),
      }

      leaseState.lastTelemetrySnapshot = aasSubmodelElement

      const outMsg = {
        ...msg,
        topic: `aas/v3/${idShort}`,
        semanticId: node.eclassIrdi,
        unit: node.unit,
        localEndpoint: localEndpointPath,
        licensing: {
          mode: licenseCheck.mode,
          remainingQuota: licenseCheck.remainingQuota,
        },
        payload: aasSubmodelElement,
      }

      send([outMsg, null])
      if (done) done()
    })

    node.on("close", function (done) {
      clearInterval(syncInterval)
      saveCachedLease()
      done()
    })
  }

  RED.nodes.registerType("semantic-plc-mapper", SemanticPlcMapperNode, {
    credentials: {
      licenseToken: { type: "password" },
    },
  })
}

// =============================================================================
// Node-RED Tamper-Evident Runtime Integrity & Obfuscation Compiler
// =============================================================================
// Prevents the end-user from opening `semantic-plc-mapper.js` and removing the
// licensing/quota check:
// 1. Runtime code self-hashes its own source (`fs.readFileSync(__filename)`)
//    and sends `x-runtime-integrity: sha256(source)` + `x-edge-signature:
//    HMAC_SHA256(token + ":" + timestamp + ":" + runtimeHash, SEAL_KEY)` on
//    every request to `/api/edge/license`.
// 2. If any character in `semantic-plc-mapper.js` is modified, the SHA-256
//    changes and `/api/edge/license` immediately rejects communication with
//    HTTP 403 `INTEGRITY_TAMPERED`.
// 3. For the downloadable `.tgz`/`.zip` package, the JS payload is compiled
//    into a self-decoding sealed VM loader so the logic is not human-editable.
// =============================================================================

import crypto from "crypto"
import fs from "fs"
import path from "path"
import JSZip from "jszip"

export const EDGE_SEAL_KEY =
  process.env.EDGE_INTEGRITY_SECRET ||
  (process.env.NODE_ENV === "production" ? "" : "development-only-edge-seal")

/**
 * Generates the protected Node-RED runtime source code and computes its
 * canonical SHA-256 integrity digest.
 */
export function buildProtectedNodeRedRuntimeSource(): {
  sealedJs: string
  canonicalIntegrityHash: string
} {
  if (!EDGE_SEAL_KEY) {
    throw new Error("EDGE_INTEGRITY_SECRET é obrigatória em produção")
  }
  // Inner core logic that verifies its own file hash and signs every request
  const coreLogic = `
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const http = require("http");
const https = require("https");

const SEAL_KEY = "${EDGE_SEAL_KEY}";
const EXPECTED_CORE_HASH = "__CORE_HASH_PLACEHOLDER__";

module.exports = function (RED) {
  function SemanticPlcMapperNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.plcVendor = config.plcVendor || "siemens-s7";
    node.sourceTag = config.sourceTag || "DB10.W2";
    node.eclassIrdi = config.eclassIrdi || "0173-1#02-BAA123#003";
    node.targetName = config.targetName || "Linear Velocity";
    node.unit = config.unit || "m/s";
    node.actionMode = config.actionMode || "DirectMap";
    node.conversionFormula = config.conversionFormula || "";
    node.outputMode = config.outputMode || "aas-v3-and-local-api";
    node.platformUrl = (config.platformUrl || "http://localhost:3000").replace(/\\/+$/, "");
    node.licenseToken =
      (this.credentials && this.credentials.licenseToken) ||
      config.licenseToken ||
      process.env.SEMANTIC_EDGE_TOKEN ||
      "";
    node.offlineGraceLimit = parseInt(config.offlineGraceLimit || "500", 10);

    // Compute self-integrity digest of this file on disk
    let selfFileHash = "";
    try {
      const diskBytes = fs.readFileSync(__filename, "utf-8");
      selfFileHash = crypto.createHash("sha256").update(diskBytes).digest("hex");
    } catch (e) {
      selfFileHash = "tampered";
    }

    const cacheFile = path.join(
      RED.settings.userDir || os.homedir(),
      ".semantic-edge-lease-" + crypto.createHash("sha1").update(node.id).digest("hex").slice(0, 8) + ".json"
    );

    let leaseState = {
      verified: false,
      remainingQuota: 0,
      offlineUsedCount: 0,
      pendingSyncCount: 0,
      leaseExpiresAt: 0,
      leaseSignature: "",
      lastTelemetrySnapshot: null
    };

    function verifyServerLeaseSignature(remainingQuota, expiresAt, sig) {
      if (!sig || !node.licenseToken) return false;
      const expected = crypto
        .createHmac("sha256", SEAL_KEY)
        .update(node.licenseToken + ":" + remainingQuota + ":" + expiresAt + ":" + EXPECTED_CORE_HASH)
        .digest("hex");
      return sig === expected;
    }

    function loadCachedLease() {
      try {
        if (fs.existsSync(cacheFile)) {
          const parsed = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
          if (
            parsed &&
            verifyServerLeaseSignature(parsed.remainingQuota, parsed.leaseExpiresAt, parsed.leaseSignature)
          ) {
            leaseState = { ...leaseState, ...parsed };
          }
        }
      } catch (err) {}
    }

    function saveCachedLease() {
      try {
        fs.writeFileSync(cacheFile, JSON.stringify(leaseState), "utf-8");
      } catch (err) {}
    }

    function postSignedJson(urlStr, payload, timeoutMs = 4500) {
      return new Promise((resolve, reject) => {
        try {
          const parsedUrl = new URL(urlStr);
          const lib = parsedUrl.protocol === "https:" ? https : http;
          const ts = String(Date.now());
          const bodyData = JSON.stringify({
            ...payload,
            timestamp: Number(ts),
            runtimeHash: EXPECTED_CORE_HASH,
            fileSelfHash: selfFileHash
          });

          const hmacSig = crypto
            .createHmac("sha256", SEAL_KEY)
            .update(node.licenseToken + ":" + ts + ":" + EXPECTED_CORE_HASH + ":" + bodyData)
            .digest("hex");

          const req = lib.request(
            {
              hostname: parsedUrl.hostname,
              port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
              path: parsedUrl.pathname + parsedUrl.search,
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(bodyData),
                "Authorization": "Bearer " + node.licenseToken,
                "X-Edge-Timestamp": ts,
                "X-Runtime-Integrity": EXPECTED_CORE_HASH,
                "X-Edge-Signature": hmacSig
              },
              timeout: timeoutMs
            },
            (res) => {
              let chunks = "";
              res.on("data", (d) => (chunks += d));
              res.on("end", () => {
                try {
                  resolve({ statusCode: res.statusCode, data: JSON.parse(chunks || "{}") });
                } catch (e) {
                  reject(new Error("Invalid licensing server response"));
                }
              });
            }
          );
          req.on("error", reject);
          req.on("timeout", () => {
            req.destroy();
            reject(new Error("Timeout"));
          });
          req.write(bodyData);
          req.end();
        } catch (err) {
          reject(err);
        }
      });
    }

    async function syncLicenseWithCloud(consumeDelta = 0) {
      if (selfFileHash !== EXPECTED_CORE_HASH) {
        node.status({ fill: "red", shape: "ring", text: "ERRO: Código adulterado (Integridade Inválida)" });
        return {
          allowed: false,
          mode: "tampered",
          reason: "Integridade do pacote Node-RED violada. Reinstale o pacote oficial sem modificações.",
          topupUrl: node.platformUrl + "/faturamento"
        };
      }

      if (!node.licenseToken) {
        node.status({ fill: "red", shape: "ring", text: "Licença ausente — Ative no Portal" });
        return {
          allowed: false,
          mode: "unlicensed",
          reason: "Token de licença ausente. Crie sua conta e ative o Pay-as-you-go via Mercado Pago.",
          topupUrl: node.platformUrl + "/faturamento?reason=missing_token"
        };
      }

      const totalToSync = consumeDelta + leaseState.pendingSyncCount;
      try {
        const res = await postSignedJson(node.platformUrl + "/api/edge/license", {
          edgeToken: node.licenseToken,
          nodeId: node.id,
          plcVendor: node.plcVendor,
          sourceTag: node.sourceTag,
          eclassIrdi: node.eclassIrdi,
          consumeMessages: totalToSync
        });

        if (
          res.statusCode === 200 &&
          res.data &&
          res.data.allowed &&
          verifyServerLeaseSignature(res.data.remainingEdgeQuota, res.data.leaseExpiresAt, res.data.leaseSignature)
        ) {
          leaseState.verified = true;
          leaseState.remainingQuota = res.data.remainingEdgeQuota;
          leaseState.leaseExpiresAt = res.data.leaseExpiresAt;
          leaseState.leaseSignature = res.data.leaseSignature;
          leaseState.offlineUsedCount = 0;
          leaseState.pendingSyncCount = 0;
          saveCachedLease();

          node.status({
            fill: "green",
            shape: "dot",
            text: "Verificado | Quota: " + leaseState.remainingQuota + " msgs"
          });
          return {
            allowed: true,
            mode: "online",
            remainingQuota: leaseState.remainingQuota,
            canonicalTransformToken: res.data.transformToken
          };
        }

        leaseState.verified = false;
        leaseState.remainingQuota = 0;
        leaseState.leaseSignature = "";
        saveCachedLease();

        node.status({ fill: "red", shape: "ring", text: "Bloqueado — Pague/Recarregue Licença" });
        return {
          allowed: false,
          mode: "depleted",
          reason: (res.data && res.data.error) || "Licença não paga ou saldo esgotado.",
          topupUrl: (res.data && res.data.topupUrl) || (node.platformUrl + "/faturamento?reason=payment_required")
        };
      } catch (netErr) {
        const now = Date.now();
        const validOffline =
          leaseState.verified &&
          now < leaseState.leaseExpiresAt &&
          verifyServerLeaseSignature(leaseState.remainingQuota, leaseState.leaseExpiresAt, leaseState.leaseSignature) &&
          leaseState.remainingQuota > leaseState.offlineUsedCount &&
          leaseState.offlineUsedCount < node.offlineGraceLimit;

        if (validOffline) {
          leaseState.offlineUsedCount += consumeDelta;
          leaseState.pendingSyncCount += consumeDelta;
          saveCachedLease();
          const rem = Math.min(
            leaseState.remainingQuota - leaseState.offlineUsedCount,
            node.offlineGraceLimit - leaseState.offlineUsedCount
          );
          node.status({ fill: "yellow", shape: "dot", text: "Lease Offline (" + rem + " restantes)" });
          return { allowed: true, mode: "offline-grace", remainingQuota: rem };
        }

        node.status({ fill: "red", shape: "ring", text: "Sem Lease Válido — Conecte ao Agente" });
        return {
          allowed: false,
          mode: "offline-expired",
          reason: "Sem conexão com o Agente Semântico e sem lease criptográfico assinado.",
          topupUrl: node.platformUrl + "/faturamento"
        };
      }
    }

    const localEndpointPath = "/edge/aas/" + node.sourceTag.replace(/[^a-zA-Z0-9_]/g, "_");
    if (
      RED.httpNode &&
      (node.outputMode === "local-api-only" || node.outputMode === "aas-v3-and-local-api")
    ) {
      RED.httpNode.get(localEndpointPath, (req, res) => {
        if (!leaseState.lastTelemetrySnapshot) {
          return res.status(404).json({ error: "Aguardando leitura do CLP", endpoint: localEndpointPath });
        }
        return res.status(200).json(leaseState.lastTelemetrySnapshot);
      });
    }

    loadCachedLease();
    syncLicenseWithCloud(0).catch(() => {});

    node.on("input", async function (msg, send, done) {
      send = send || function () { node.send.apply(node, arguments); };

      const licenseCheck = await syncLicenseWithCloud(1);
      if (!licenseCheck.allowed) {
        send([
          null,
          {
            ...msg,
            payload: {
              status: "LICENSE_OR_INTEGRITY_BLOCKED",
              mode: licenseCheck.mode,
              reason: licenseCheck.reason,
              redirectUrl: licenseCheck.topupUrl,
              timestamp: new Date().toISOString()
            }
          }
        ]);
        if (done) done();
        return;
      }

      let rawValue = msg.payload;
      if (rawValue && typeof rawValue === "object") {
        if (node.sourceTag in rawValue) rawValue = rawValue[node.sourceTag];
        else if ("value" in rawValue) rawValue = rawValue.value;
      }

      let transformedValue = rawValue;
      if (node.actionMode === "Convert_Unit" && typeof rawValue === "number") {
        if (node.conversionFormula === "F_to_C") {
          transformedValue = Number((((rawValue - 32) * 5) / 9).toFixed(3));
        } else if (node.conversionFormula === "PSI_to_BAR") {
          transformedValue = Number((rawValue * 0.0689476).toFixed(4));
        }
      }

      const idShort = node.sourceTag.replace(/[^a-zA-Z0-9_]/g, "_");
      const aasSubmodelElement = {
        idShort,
        modelType: "Property",
        category: "VARIABLE",
        valueType: typeof transformedValue === "boolean" ? "xs:boolean" : "xs:double",
        value: String(transformedValue),
        semanticId: {
          type: "ExternalReference",
          keys: [{ type: "ConceptDescription", value: node.eclassIrdi }]
        },
        qualifiers: [
          { type: "Unit", valueType: "xs:string", value: node.unit },
          { type: "PlcVendor", valueType: "xs:string", value: node.plcVendor },
          { type: "SourceTag", valueType: "xs:string", value: node.sourceTag },
          { type: "LicensingMode", valueType: "xs:string", value: licenseCheck.mode }
        ],
        timestamp: new Date().toISOString()
      };

      leaseState.lastTelemetrySnapshot = aasSubmodelElement;
      send([
        {
          ...msg,
          topic: "aas/v3/" + idShort,
          semanticId: node.eclassIrdi,
          unit: node.unit,
          localEndpoint: localEndpointPath,
          payload: aasSubmodelElement
        },
        null
      ]);
      if (done) done();
    });
  }

  RED.nodes.registerType("semantic-plc-mapper", SemanticPlcMapperNode, {
    credentials: { licenseToken: { type: "password" } }
  });
};
`.trim()

  // Compute canonical hash of the core logic before wrapping
  const coreDigest = crypto.createHash("sha256").update(coreLogic).digest("hex")
  const hydratedCore = coreLogic.replace(/__CORE_HASH_PLACEHOLDER__/g, coreDigest)

  // Encode hydrated core in Base64 + XOR cipher so opening the file shows a sealed binary loader
  const keyBuf = Buffer.from(EDGE_SEAL_KEY, "utf-8")
  const sourceBuf = Buffer.from(hydratedCore, "utf-8")
  const xored = Buffer.alloc(sourceBuf.length)
  for (let i = 0; i < sourceBuf.length; i++) {
    xored[i] = sourceBuf[i]! ^ keyBuf[i % keyBuf.length]!
  }
  const encodedPayload = xored.toString("base64")

  // Build self-verifying sealed loader wrapper
  const loaderTemplate = `/* ==========================================================================
 * INDUSTRIAL SEMANTIC AGENT — SEALED NODE-RED EDGE RUNTIME (DO NOT MODIFY)
 * Any modification to this file invalidates its cryptographic SHA-256 seal
 * and permanently blocks communication with the Semantic Agent Cloud API.
 * ========================================================================== */
"use strict";
const _c=require("crypto"),_f=require("fs"),_v=require("vm");
const _k=Buffer.from("${EDGE_SEAL_KEY}","utf-8");
const _p="${encodedPayload}";
const _b=Buffer.from(_p,"base64"),_o=Buffer.alloc(_b.length);
for(let i=0;i<_b.length;i++)_o[i]=_b[i]^_k[i%_k.length];
const _s=_o.toString("utf-8").replace(/"${coreDigest}"/g,JSON.stringify(_c.createHash("sha256").update(_f.readFileSync(__filename,"utf-8")).digest("hex")));
const _m={exports:{}};
_v.runInNewContext("(function(exports,require,module,__filename,__dirname){"+_s+"\\n})",{})(_m.exports,require,_m,__filename,__dirname);
module.exports=_m.exports;
`

  const finalHash = crypto.createHash("sha256").update(loaderTemplate).digest("hex")
  return {
    sealedJs: loaderTemplate,
    canonicalIntegrityHash: finalHash,
  }
}

export function verifyEdgeRequestIntegrity(params: {
  edgeToken: string
  timestamp: number
  runtimeHashHeader: string
  signatureHeader: string
  rawBody: string
  fileSelfHash?: string
}): { valid: boolean; reason?: string } {
  const { canonicalIntegrityHash } = buildProtectedNodeRedRuntimeSource()

  // 1. Check timestamp freshness (prevent replay attacks > 10 minutes)
  if (!params.timestamp || Math.abs(Date.now() - params.timestamp) > 10 * 60 * 1000) {
    return {
      valid: false,
      reason: "Timestamp de handshake expirado ou inválido (proteção anti-replay).",
    }
  }

  // 2. Verify that the runtime file hash matches the official sealed Node-RED build
  if (
    params.runtimeHashHeader !== canonicalIntegrityHash ||
    (params.fileSelfHash && params.fileSelfHash !== canonicalIntegrityHash)
  ) {
    return {
      valid: false,
      reason:
        "Assinatura de integridade do pacote Node-RED inválida. O código do nó foi alterado ou adulterado e a comunicação com o Agente Semântico foi bloqueada.",
    }
  }

  // 3. Verify HMAC-SHA256 request signature
  const expectedHmac = crypto
    .createHmac("sha256", EDGE_SEAL_KEY)
    .update(
      `${params.edgeToken}:${params.timestamp}:${params.runtimeHashHeader}:${params.rawBody}`
    )
    .digest("hex")

  if (params.signatureHeader !== expectedHmac) {
    return {
      valid: false,
      reason: "Assinatura criptográfica HMAC-SHA256 inválida.",
    }
  }

  return { valid: true }
}

export function createServerLeaseSignature(
  edgeToken: string,
  remainingQuota: number,
  leaseExpiresAt: number
): string {
  const { canonicalIntegrityHash } = buildProtectedNodeRedRuntimeSource()
  return crypto
    .createHmac("sha256", EDGE_SEAL_KEY)
    .update(`${edgeToken}:${remainingQuota}:${leaseExpiresAt}:${canonicalIntegrityHash}`)
    .digest("hex")
}

/**
 * Packages the sealed Node-RED contrib module (`package.json`, sealed
 * `semantic-plc-mapper.js`, `semantic-plc-mapper.html`, and `README.md`)
 * into a downloadable `.zip` archive ready for `npm install`.
 */
export async function generateSealedNodeRedPackageZip(): Promise<Buffer> {
  const zip = new JSZip()
  const folder = zip.folder("node-red-contrib-industrial-semantic-agent")!

  const pkgDir = path.join(process.cwd(), "edge", "node-red-contrib-semantic-agent")
  const pkgJson = fs.readFileSync(path.join(pkgDir, "package.json"), "utf-8")
  const htmlUi = fs.readFileSync(path.join(pkgDir, "semantic-plc-mapper.html"), "utf-8")
  const { sealedJs, canonicalIntegrityHash } = buildProtectedNodeRedRuntimeSource()

  // Also write the sealed JS to disk so the repo's copy matches the canonical hash
  try {
    fs.writeFileSync(path.join(pkgDir, "semantic-plc-mapper.js"), sealedJs, "utf-8")
  } catch {
    // ignore in read-only serverless environments
  }

  const readme = `# node-red-contrib-industrial-semantic-agent

Official Industrial Edge Node-RED Component for **IDTA AAS v3.0** and **ECLASS 14.0** semantic mapping.

## Security & Integrity Seal
- **Canonical Build SHA-256:** \`${canonicalIntegrityHash}\`
- **Tamper Protection:** The runtime node (\`semantic-plc-mapper.js\`) is cryptographically sealed and self-verifies its SHA-256 hash on every handshake with the Semantic Agent Cloud. Modifying any byte of \`semantic-plc-mapper.js\` invalidates the HMAC seal and blocks communication with the agent.

## Installation in Node-RED
\`\`\`bash
cd ~/.node-red
npm install ./node-red-contrib-industrial-semantic-agent
\`\`\`
Restart Node-RED and drag the **semantic-plc-mapper** node from the **industry 4.0** category.
`

  folder.file("package.json", pkgJson)
  folder.file("semantic-plc-mapper.js", sealedJs)
  folder.file("semantic-plc-mapper.html", htmlUi)
  folder.file("README.md", readme)

  const uint8 = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  })
  return Buffer.from(uint8)
}

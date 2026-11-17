import { readFile } from "node:fs/promises"
import { getEclassCandidates, inferEclassFromTag } from "../lib/eclass-fallback.ts"

type GoldenCase = {
  id: string
  tagName: string
  description?: string
  expectedEclassId: string | null
  expectedHitl: boolean
}

async function main() {
  const datasetPath = new URL("../eval/golden-mappings.json", import.meta.url)
  const dataset = JSON.parse(await readFile(datasetPath, "utf8")) as GoldenCase[]

  if (dataset.length === 0) {
    throw new Error("Golden dataset vazio")
  }

  let retrievalHitsAt1 = 0
  let retrievalHitsAt5 = 0
  let retrievalHitsAt10 = 0
  let hitlExpectationsCorrect = 0
  const failures: string[] = []

  for (const item of dataset) {
    const candidates = getEclassCandidates(item.tagName, item.description)
    const ids = candidates.map((candidate) => candidate.eclassId)
    const expectedId = item.expectedEclassId
    const top1Hit = expectedId !== null && ids[0] === expectedId
    const top5Hit = expectedId !== null && ids.slice(0, 5).includes(expectedId)
    const top10Hit = expectedId !== null && ids.slice(0, 10).includes(expectedId)
    const inferred = inferEclassFromTag(item.tagName, item.description)
    const actualHitl = inferred.confidence < 0.85

    if (top1Hit) retrievalHitsAt1 += 1
    if (top5Hit) retrievalHitsAt5 += 1
    if (top10Hit) retrievalHitsAt10 += 1
    if (actualHitl === item.expectedHitl) hitlExpectationsCorrect += 1

    const expectedRetrieved = expectedId === null || top5Hit
    if (!expectedRetrieved) {
      failures.push(`${item.id}: ${expectedId} não apareceu no top-5 (${ids.join(", ")})`)
    }
    if (actualHitl !== item.expectedHitl) {
      failures.push(`${item.id}: HITL esperado=${item.expectedHitl}, obtido=${actualHitl}`)
    }
  }

  const labeledCases = dataset.filter((item) => item.expectedEclassId !== null).length
  const ratio = (value: number, total: number) => (total === 0 ? 0 : value / total)
  const metrics = {
    dataset: "lexical-fallback-baseline",
    cases: dataset.length,
    labeledCases,
    recallAt1: ratio(retrievalHitsAt1, labeledCases),
    recallAt5: ratio(retrievalHitsAt5, labeledCases),
    recallAt10: ratio(retrievalHitsAt10, labeledCases),
    hitlExpectationAccuracy: ratio(hitlExpectationsCorrect, dataset.length),
    failures,
  }

  console.log(JSON.stringify(metrics, null, 2))

  if (failures.length > 0) {
    process.exitCode = 1
  }
}

void main()

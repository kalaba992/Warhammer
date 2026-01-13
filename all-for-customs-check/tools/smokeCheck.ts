#!/usr/bin/env tsx
/**
 * Convex KB smoke check
 *
 * Usage:
 *   CONVEX_DEPLOYMENT=https://... npx tsx tools/smokeCheck.ts \
 *     --report ./out_convex_bundle/report.json \
 *     --tenant default \
 *     --corpus-version "0.1.0"
 *
 * Checks:
 * 1) Counts in report.json match Convex SoT counts (documents/citations/chunks).
 * 2) Hydrates 3 sample chunks and asserts citation/document presence and page range.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";
import { ConvexHttpClient } from "convex/browser";

type ReportData = {
  documents: number;
  citations: number;
  chunks: number;
  corpus_version?: string;
};

type HydratedLocator = { page_from?: number; page_to?: number };
type HydratedCitation = { snapshot_hash_sha256?: string; locator?: HydratedLocator };
type HydratedChunk = {
  chunk?: { chunk_id?: string };
  citation?: HydratedCitation | null;
  document?: Record<string, unknown> | null;
};

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string, fallback?: string) => {
    const idx = argv.indexOf(flag);
    return idx >= 0 ? argv[idx + 1] : fallback;
  };
  const report = get("--report");
  const tenant = get("--tenant", "default");
  const corpusVersion = get("--corpus-version");
  if (!report) throw new Error("--report is required");
  if (!corpusVersion) throw new Error("--corpus-version is required");
  return { report, tenant, corpusVersion };
}

async function pickChunkIds(chunksPath: string, limit = 3): Promise<string[]> {
  if (!fs.existsSync(chunksPath)) return [];
  const rl = readline.createInterface({ input: fs.createReadStream(chunksPath), crlfDelay: Infinity });
  const ids: string[] = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      if (typeof row.chunk_id === "string") ids.push(row.chunk_id);
      if (ids.length >= limit) break;
    } catch {
      // skip malformed lines
    }
  }
  rl.close();
  return ids;
}

function getConvexHttpUrl(): string {
  const url = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
  if (url && (url.startsWith("https://") || url.startsWith("http://"))) return url;

  const dep = process.env.CONVEX_DEPLOYMENT;
  if (dep && (dep.startsWith("https://") || dep.startsWith("http://"))) return dep;

  throw new Error(
    "Missing Convex HTTP URL. Set CONVEX_URL or VITE_CONVEX_URL to https://<deployment>.convex.cloud (do not use dev:... for tools)."
  );
}

async function main() {
  const { report, tenant, corpusVersion: cliCorpusVersion } = parseArgs();
  const deployment = getConvexHttpUrl();

  const reportData = JSON.parse(fs.readFileSync(report, "utf-8")) as ReportData;
  const bundleDir = path.dirname(report);
  const chunksPath = path.join(bundleDir, "chunks.jsonl");
  const docPath = path.join(bundleDir, "documents.jsonl");

  // Get corpus_version: CLI flag > report.json > first document
  let corpusVersion = cliCorpusVersion || reportData.corpus_version;
  if (!corpusVersion && fs.existsSync(docPath)) {
    const firstLine = fs.readFileSync(docPath, "utf-8").split("\n")[0];
    if (firstLine) {
      try {
        const doc = JSON.parse(firstLine);
        corpusVersion = doc.corpus_version;
      } catch {
        // intentionally empty: allow fallback if documents.jsonl lacks corpus_version
      }
    }
  }
  if (!corpusVersion) {
    throw new Error("corpus_version not found. Use --corpus-version flag, or ensure report.json or documents.jsonl contains it.");
  }

  const client = new ConvexHttpClient(deployment);

  // Read ingestion report from Convex
  const serverReport = await client.query("functions/ingestion_reports:getIngestionReport", {
    tenant_id: tenant,
    corpus_version: corpusVersion,
  });
  if (!serverReport) throw new Error("No ingestion report found in Convex for this corpus_version");
  if (
    serverReport.counts.documents !== reportData.documents ||
    serverReport.counts.citations !== reportData.citations ||
    serverReport.counts.chunks !== reportData.chunks
  ) {
    throw new Error(
      `Count mismatch: Convex ingestion_report = ${serverReport.counts.documents}/${serverReport.counts.citations}/${serverReport.counts.chunks}, ` +
        `report = ${reportData.documents}/${reportData.citations}/${reportData.chunks}`
    );
  }

  const chunkIds = await pickChunkIds(chunksPath, 3);
  if (chunkIds.length === 0) throw new Error("No chunk_ids found in chunks.jsonl for hydration test");

  const hydration = await client.query("functions/search:hydrateChunks", {
    tenant_id: tenant,
    chunk_ids: chunkIds,
    include_parent: false,
    enforce_active_corpus: false,
  });

  hydration.forEach((h: HydratedChunk) => {
    if (!h?.chunk || !h?.citation || !h?.document) {
      throw new Error(`Hydration missing entities for chunk ${h?.chunk?.chunk_id ?? "unknown"}`);
    }
    if (!h.citation.snapshot_hash_sha256 || !h.citation.locator?.page_from || !h.citation.locator?.page_to) {
      throw new Error(`Hydration missing citation proof/page range for chunk ${h.chunk.chunk_id}`);
    }
  });

  console.log("Smoke check passed: counts match and hydration returned citation+document+pages for sample chunks.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

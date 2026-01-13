#!/usr/bin/env npx tsx
/**
 * convex_import.ts
 * 
 * Import JSONL bundle (documents → citations → chunks) into Convex SoT KB.
 * Requires CONVEX_DEPLOYMENT environment variable.
 * 
 * Usage:
 *   export CONVEX_DEPLOYMENT="<your-deployment-url>"
 *   npx tsx convex_import.ts --dir ./out_convex_bundle --tenant default
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

type JsonRecord = Record<string, unknown>;
type DocumentRecord = JsonRecord;
type CitationRecord = JsonRecord;
type ChunkRecord = JsonRecord & { index_pending?: boolean };

async function importJSONL<T extends JsonRecord>(filePath: string): Promise<T[]> {
  const records: T[] = [];
  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.trim()) {
      records.push(JSON.parse(line) as T);
    }
  }

  return records;
}

async function main() {
  const args = process.argv.slice(2);
  const dirIndex = args.indexOf("--dir");
  const tenantIndex = args.indexOf("--tenant");
  const corpusVersionIndex = args.indexOf("--corpus-version");
  const sourceZipIndex = args.indexOf("--source-zip");

  if (dirIndex === -1 || tenantIndex === -1) {
    console.error("Usage: npx tsx convex_import.ts --dir <bundle-dir> --tenant <tenant-id> [--corpus-version <version>] [--source-zip <zipfile>]");
    process.exit(1);
  }

  const bundleDir = args[dirIndex + 1];
  const tenantId = args[tenantIndex + 1];
  const corpusVersion = corpusVersionIndex !== -1 ? args[corpusVersionIndex + 1] : null;
  const sourceZip = sourceZipIndex !== -1 ? args[sourceZipIndex + 1] : null;

  function getConvexHttpUrl(): string {
    const url = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
    if (url && (url.startsWith("https://") || url.startsWith("http://"))) return url;

    const dep = process.env.CONVEX_DEPLOYMENT;
    if (dep && (dep.startsWith("https://") || dep.startsWith("http://"))) return dep;

    throw new Error(
      "Missing Convex HTTP URL. Set CONVEX_URL or VITE_CONVEX_URL to https://<deployment>.convex.cloud (do not use dev:... for tools)."
    );
  }

  const deployment = getConvexHttpUrl();
  const client = new ConvexHttpClient(deployment);

  console.log(`📦 Importing from ${bundleDir} into tenant '${tenantId}'`);

  // Step 1: Import documents
  const documentsPath = path.join(bundleDir, "documents.jsonl");
  const documents = await importJSONL<DocumentRecord>(documentsPath);
  console.log(`   Importing ${documents.length} documents...`);

  for (const doc of documents) {
    await client.mutation(api.functions.documents.upsertDocument, {
      tenant_id: tenantId,
      document: doc,
    });
  }
  console.log(`   ✅ Documents imported`);


  // Step 2: Import citations (sanitize extra fields)
  const citationsPath = path.join(bundleDir, "citations.jsonl");
  const citations = await importJSONL<CitationRecord>(citationsPath);
  console.log(`   Importing ${citations.length} citations...`);

  for (const raw of citations) {
    // Remove fields not accepted by citation validator
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updated_at: _updatedAt, ...citation } = raw;
    await client.mutation(api.functions.citations.upsertCitation, {
      tenant_id: tenantId,
      citation,
    });
  }
  console.log(`   ✅ Citations imported`);

  // Step 3: Import chunks (sanitize extra fields and force index_pending)
  const chunksPath = path.join(bundleDir, "chunks.jsonl");
  const chunks = await importJSONL<ChunkRecord>(chunksPath);
  console.log(`   Importing ${chunks.length} chunks...`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch: ChunkRecord[] = [];
    for (const raw of chunks.slice(i, i + BATCH_SIZE)) {
      // Remove fields not accepted by chunk validator
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { snapshot_hash_sha256: _snapshotHash, snapshot_pointer: _snapshotPointer, ...chunk } = raw;
      // Hard requirement: force index_pending=true on initial import
      const chunkWithoutSnapshots: ChunkRecord = { ...chunk, index_pending: true };
      batch.push(chunkWithoutSnapshots);
    }
    await client.mutation(api.functions.chunks.writeChunksBatch, {
      tenant_id: tenantId,
      chunks: batch,
    });
  }
  console.log(`   ✅ Chunks imported`);


  // After import, upsert ingestion report
  const reportPath = path.join(bundleDir, "report.json");
  let reportCounts = null;
  if (fs.existsSync(reportPath)) {
    reportCounts = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  }
  if (corpusVersion && sourceZip && reportCounts) {
    await client.mutation("functions/ingestion_reports:upsertIngestionReport", {
      tenant_id: tenantId,
      corpus_version: corpusVersion,
      source_zip: sourceZip,
      counts: reportCounts,
      created_at: new Date().toISOString(),
    });
    console.log(`   ✅ Ingestion report upserted for corpus_version=${corpusVersion}, source_zip=${sourceZip}`);
  } else {
    console.warn("   ⚠️ Skipping ingestion report upsert (missing --corpus-version, --source-zip, or report.json)");
  }

  console.log("🎉 Import complete!");
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});

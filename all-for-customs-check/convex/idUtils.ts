// convex/idUtils.ts
// Deterministička ID konvencija za Convex Knowledge Base
import { sha256Hex } from "./hash";

export async function documentId(source_url: string): Promise<string> {
  const hash = await sha256Hex(source_url);
  return "doc_" + hash.slice(0, 12);
}

export async function chunkId(document_id: string, ordinal: number, text_hash: string): Promise<string> {
  const hash = await sha256Hex(`${document_id}:${ordinal}:${text_hash}`);
  return "chk_" + hash.slice(0, 16);
}

export async function citationId(chunk_id: string, snapshot_hash: string, locator: string): Promise<string> {
  const hash = await sha256Hex(`${chunk_id}:${snapshot_hash}:${locator}`);
  return "cit_" + hash.slice(0, 16);
}

export function bundleId(request_id: string): string {
  return "eb_" + request_id;
}

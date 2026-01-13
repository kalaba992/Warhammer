import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { chunkId, citationId, documentId } from "../idUtils";
import { sha256Hex } from "../hash";

const locatorValidator = v.object({
  page_from: v.optional(v.number()),
  page_to: v.optional(v.number()),
  char_from: v.optional(v.number()),
  char_to: v.optional(v.number()),
  selector: v.optional(v.string()),
});

const chunkInput = v.object({
  ordinal: v.number(),
  section_path: v.array(v.string()),
  article_no: v.optional(v.string()),
  paragraph_no: v.optional(v.string()),
  point_no: v.optional(v.string()),
  table_id: v.optional(v.string()),
  text: v.string(),
  language: v.string(),
  jurisdiction: v.string(),
  instrument_type: v.string(),
  trust_level: v.string(),
  source_trust_level: v.optional(v.string()),
  doc_status: v.optional(v.string()),
  effective_from: v.string(),
  effective_to: v.string(),
  snapshot_pointer: v.string(),
  snapshot_hash_sha256: v.string(),
  locator: locatorValidator,
  created_at: v.string(),
  updated_at: v.string(),
});

const documentInput = v.object({
  source_name: v.string(),
  source_url: v.string(),
  source_trust_level: v.string(),
  jurisdiction: v.string(),
  instrument_type: v.string(),
  title: v.string(),
  language: v.string(),
  effective_from: v.string(),
  effective_to: v.string(),
  content_hash_sha256: v.string(),
  snapshot_pointer: v.string(),
  mime: v.string(),
  size_bytes: v.number(),
  corpus_version: v.string(),
  status: v.union(v.literal("active"), v.literal("superseded"), v.literal("revoked")),
  supersedes_document_id: v.optional(v.string()),
  created_at: v.string(),
  updated_at: v.string(),
  chunks: v.array(chunkInput),
});

export const ingestBatch = mutation({
  args: {
    tenant_id: v.string(),
    run_id: v.string(),
    source_id: v.string(),
    corpus_version: v.string(),
    documents: v.array(documentInput),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query("ingestion_runs")
      .withIndex("by_tenant_run_id", (q) => q.eq("tenant_id", args.tenant_id).eq("run_id", args.run_id))
      .first();

    if (!run || run.status !== "running") {
      return { ok: false, error: "run_not_running" as const };
    }

    const totals = {
      documents_new: 0,
      documents_updated: 0,
      chunks_written: 0,
      citations_written: 0,
    };

    for (const doc of args.documents) {
      const document_id = await documentId(doc.source_url);

      const existingDoc = await ctx.db
        .query("documents")
        .withIndex("by_tenant_document_id", (q) => q.eq("tenant_id", args.tenant_id).eq("document_id", document_id))
        .first();

      const baseDoc = {
        tenant_id: args.tenant_id,
        document_id,
        source_name: doc.source_name,
        source_url: doc.source_url,
        source_trust_level: doc.source_trust_level,
        jurisdiction: doc.jurisdiction,
        instrument_type: doc.instrument_type,
        title: doc.title,
        language: doc.language,
        effective_from: doc.effective_from,
        effective_to: doc.effective_to,
        content_hash_sha256: doc.content_hash_sha256,
        snapshot_pointer: doc.snapshot_pointer,
        mime: doc.mime,
        size_bytes: doc.size_bytes,
        corpus_version: doc.corpus_version,
        status: doc.status,
        supersedes_document_id: doc.supersedes_document_id,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      };

      if (existingDoc) {
        await ctx.db.patch(existingDoc._id, baseDoc);
        totals.documents_updated += 1;
      } else {
        await ctx.db.insert("documents", baseDoc);
        totals.documents_new += 1;
      }

      for (const chunk of doc.chunks) {
        const text_hash_sha256 = await sha256Hex(chunk.text);
        const chunk_id = await chunkId(document_id, chunk.ordinal, text_hash_sha256);
        const locatorKey = JSON.stringify(chunk.locator ?? {});
        const computedCitationId = await citationId(chunk_id, chunk.snapshot_hash_sha256, locatorKey);

        // Guardrail: citation must have hash + page range.
        if (!chunk.snapshot_hash_sha256 || !chunk.locator?.page_from || !chunk.locator?.page_to) {
          return { ok: false, error: "missing_citation_proof" as const, chunk_id };
        }

        // Insert/upsert citation first (documents → citations → chunks).
        const existingCitation = await ctx.db
          .query("citations")
          .withIndex("by_tenant_citation_id", (q) => q.eq("tenant_id", args.tenant_id).eq("citation_id", computedCitationId))
          .first();

        if (existingCitation) {
          await ctx.db.patch(existingCitation._id, {
            tenant_id: args.tenant_id,
            citation_id: computedCitationId,
            document_id,
            chunk_id,
            corpus_version: doc.corpus_version,
            snapshot_pointer: chunk.snapshot_pointer,
            locator: chunk.locator,
            snapshot_hash_sha256: chunk.snapshot_hash_sha256,
            created_at: chunk.created_at,
          });
        } else {
          await ctx.db.insert("citations", {
            tenant_id: args.tenant_id,
            citation_id: computedCitationId,
            document_id,
            chunk_id,
            corpus_version: doc.corpus_version,
            snapshot_pointer: chunk.snapshot_pointer,
            locator: chunk.locator,
            snapshot_hash_sha256: chunk.snapshot_hash_sha256,
            created_at: chunk.created_at,
          });
        }

        const existingChunk = await ctx.db
          .query("chunks")
          .withIndex("by_tenant_chunk_id", (q) => q.eq("tenant_id", args.tenant_id).eq("chunk_id", chunk_id))
          .first();

        const baseChunk = {
          tenant_id: args.tenant_id,
          chunk_id,
          document_id,
          parent_chunk_id: undefined,
          ordinal: chunk.ordinal,
          section_path: chunk.section_path,
          article_no: chunk.article_no,
          paragraph_no: chunk.paragraph_no,
          point_no: chunk.point_no,
          table_id: chunk.table_id,
          text: chunk.text,
          text_hash_sha256,
          language: chunk.language,
          jurisdiction: chunk.jurisdiction,
          instrument_type: chunk.instrument_type,
          trust_level: chunk.trust_level,
          source_trust_level: chunk.source_trust_level,
          doc_status: chunk.doc_status ?? doc.status,
          effective_from: chunk.effective_from,
          effective_to: chunk.effective_to,
          citation_id: computedCitationId,
          corpus_version: doc.corpus_version,
          index_pending: true,
          indexed_at: undefined,
          created_at: chunk.created_at,
          updated_at: chunk.updated_at,
        };

        if (existingChunk) {
          await ctx.db.patch(existingChunk._id, baseChunk);
        } else {
          await ctx.db.insert("chunks", baseChunk);
        }

        totals.chunks_written += 1;
        totals.citations_written += 1;
      }
    }

    const mergedStats = {
      documents_new: run.stats.documents_new + totals.documents_new,
      documents_updated: run.stats.documents_updated + totals.documents_updated,
      chunks_written: run.stats.chunks_written + totals.chunks_written,
      citations_written: run.stats.citations_written + totals.citations_written,
    };

    await ctx.db.patch(run._id, { stats: mergedStats });

    return {
      ok: true,
      run_id: args.run_id,
      stats: mergedStats,
      processed_documents: args.documents.length,
      processed_chunks: totals.chunks_written,
    };
  },
});

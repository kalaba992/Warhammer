// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tenants: defineTable({
    tenant_id: v.string(),
    plan: v.string(),
    locales: v.array(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_tenant_id", ["tenant_id"]),

  // Tenant settings (active corpus version, policies)
  tenant_settings: defineTable({
    tenant_id: v.string(),
    active_corpus_version: v.string(),
    allow_fallback_to_older: v.boolean(),
    updated_at: v.string(),
  })
    .index("by_tenant_id", ["tenant_id"]),

  // Whitelist izvora (governance)
  sources: defineTable({
    tenant_id: v.string(),
    source_id: v.string(),                 // stable external id
    name: v.string(),
    url: v.string(),
    enabled: v.boolean(),
    trust_level: v.string(),               // state/official/secondary/internal
    jurisdiction: v.string(),              // BIH/EU/CEFTA/PEM...
    fetch_interval_hours: v.number(),
    last_fetched_at: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("by_tenant_source_id", ["tenant_id", "source_id"])
    .index("by_tenant_enabled", ["tenant_id", "enabled"])
    .index("by_tenant_jurisdiction", ["tenant_id", "jurisdiction"]),

  // Ingestion reports (lightweight counts per corpus_version)
  ingestion_reports: defineTable({
    tenant_id: v.string(),
    corpus_version: v.string(),
    source_zip: v.string(),
    counts: v.object({
      documents: v.number(),
      citations: v.number(),
      chunks: v.number(),
    }),
    created_at: v.string(),
  })
    .index("by_tenant_corpus", ["tenant_id", "corpus_version"])
    .index("by_tenant_created_at", ["tenant_id", "created_at"]),

  // Ingestion run log (audit & reproducibility)
  ingestion_runs: defineTable({
    tenant_id: v.string(),
    run_id: v.string(),
    source_id: v.string(),
    corpus_version: v.string(),
    status: v.union(v.literal("running"), v.literal("success"), v.literal("failed")),
    started_at: v.string(),
    finished_at: v.optional(v.string()),
    error: v.optional(v.string()),
    stats: v.object({
      documents_new: v.number(),
      documents_updated: v.number(),
      chunks_written: v.number(),
      citations_written: v.number(),
    }),
  })
    .index("by_tenant_run_id", ["tenant_id", "run_id"])
    .index("by_tenant_status", ["tenant_id", "status"])
    .index("by_tenant_source", ["tenant_id", "source_id"]),

  // System of Record: dokumenti
  documents: defineTable({
    tenant_id: v.string(),
    document_id: v.string(),
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
  })
    .index("by_tenant_document_id", ["tenant_id", "document_id"])
    .index("by_tenant_jurisdiction_effective", ["tenant_id", "jurisdiction", "effective_from"])
    .index("by_tenant_source_trust", ["tenant_id", "source_trust_level"])
    .index("by_tenant_corpus_version", ["tenant_id", "corpus_version"])
    .index("by_tenant_doc_status", ["tenant_id", "status"]),

  // SoT: chunkovi (najmanja pravna jedinica)
  chunks: defineTable({
    tenant_id: v.string(),
    chunk_id: v.string(),
    document_id: v.string(),
    parent_chunk_id: v.optional(v.string()),
    ordinal: v.number(),
    section_path: v.array(v.string()),
    article_no: v.optional(v.string()),
    paragraph_no: v.optional(v.string()),
    point_no: v.optional(v.string()),
    table_id: v.optional(v.string()),
    text: v.string(),
    text_hash_sha256: v.string(),
    language: v.string(),
    jurisdiction: v.string(),
    instrument_type: v.string(),
    trust_level: v.string(),

    // NEW: denormalizacija radi brzine filtera (optional zbog existing data)
    source_trust_level: v.optional(v.string()),
    doc_status: v.optional(v.string()), // active/superseded/revoked

    effective_from: v.string(),
    effective_to: v.string(),
    citation_id: v.string(),
    corpus_version: v.string(),
    index_pending: v.boolean(),
    indexed_at: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("by_tenant_chunk_id", ["tenant_id", "chunk_id"])
    .index("by_tenant_document_ordinal", ["tenant_id", "document_id", "ordinal"])
    .index("by_tenant_citation_id", ["tenant_id", "citation_id"])
    .index("by_tenant_effective", ["tenant_id", "jurisdiction", "effective_from"])
    .index("by_tenant_index_pending", ["tenant_id", "index_pending"])
    .index("by_tenant_pending_corpus", ["tenant_id", "index_pending", "corpus_version"])
    // NEW: parent lookup & filter-friendly indeksi
    .index("by_tenant_parent", ["tenant_id", "parent_chunk_id"])
    .index("by_tenant_doc_status_effective", ["tenant_id", "jurisdiction", "doc_status", "effective_from"])
    .index("by_tenant_trust_effective", ["tenant_id", "jurisdiction", "source_trust_level", "effective_from"])
    // Full-text search index (Tantivy/BM25)
    .searchIndex("search_chunks_text", {
      searchField: "text",
      filterFields: [
        "tenant_id",
        "corpus_version",
        "jurisdiction",
        "instrument_type",
        "language",
        "trust_level",
        "document_id",
      ],
    }),

  // SoT: citati
  citations: defineTable({
    tenant_id: v.string(),
    citation_id: v.string(),
    document_id: v.string(),
    chunk_id: v.string(),
    corpus_version: v.string(),
    snapshot_pointer: v.string(),
    locator: v.object({
      page_from: v.optional(v.number()),
      page_to: v.optional(v.number()),
      char_from: v.optional(v.number()),
      char_to: v.optional(v.number()),
      selector: v.optional(v.string()),
    }),
    snapshot_hash_sha256: v.string(),
    created_at: v.string(),
  })
    .index("by_tenant_citation_id", ["tenant_id", "citation_id"])
    .index("by_tenant_document_id", ["tenant_id", "document_id"])
    .index("by_tenant_chunk_id", ["tenant_id", "chunk_id"])
    .index("by_tenant_corpus_version", ["tenant_id", "corpus_version"]),

  evidence_bundles: defineTable({
    tenant_id: v.string(),
    bundle_id: v.string(),
    request_id: v.string(),
    corpus_version: v.string(),
    input_hash_sha256: v.string(),
    snapshot_pointer: v.string(),
    created_at: v.string(),
    jws: v.object({
      protected: v.string(),
      payload: v.string(),
      signature: v.string(),
      hsm_stub: v.object({ enabled: v.boolean(), key_id: v.string() }),
    }),
    citation_ids: v.array(v.string()),
  })
    .index("by_tenant_bundle_id", ["tenant_id", "bundle_id"])
    .index("by_tenant_request_id", ["tenant_id", "request_id"])
    .index("by_tenant_corpus_version", ["tenant_id", "corpus_version"]),

  decisions: defineTable({
    tenant_id: v.string(),
    request_id: v.string(),
    time: v.string(),
    status: v.union(v.literal("FINAL"), v.literal("STOP")),
    reason: v.optional(v.string()),
    engine_version: v.string(),
    corpus_version: v.string(),
    snapshot_pointer: v.string(),
    hs_candidate: v.string(),
    confidence: v.number(),
    gir_path: v.array(v.string()),
    citation_ids: v.array(v.string()),
    evidence_bundle_id: v.string(),
    decision_hash_sha256: v.string(),
    created_at: v.string(),
  })
    .index("by_tenant_request_id", ["tenant_id", "request_id"])
    .index("by_tenant_status_time", ["tenant_id", "status", "time"])
    .index("by_tenant_corpus_version", ["tenant_id", "corpus_version"]),
});

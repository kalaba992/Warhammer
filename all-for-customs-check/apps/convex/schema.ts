// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tenants: defineTable({
    tenant_id: v.string(),
    plan: v.string(),
    locales: v.array(v.string()),
    created_at: v.string(),
    updated_at: v.string()
  })
    .index("by_tenant_id", ["tenant_id"]),

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
    updated_at: v.string()
  })
    .index("by_tenant_document_id", ["tenant_id", "document_id"])
    .index("by_tenant_jurisdiction_effective", ["tenant_id", "jurisdiction", "effective_from"])
    .index("by_tenant_source_trust", ["tenant_id", "source_trust_level"])
    .index("by_tenant_corpus_version", ["tenant_id", "corpus_version"]),

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
    effective_from: v.string(),
    effective_to: v.string(),
    citation_id: v.string(),
    corpus_version: v.string(),
    index_pending: v.boolean(),
    indexed_at: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string()
  })
    .index("by_tenant_chunk_id", ["tenant_id", "chunk_id"])
    .index("by_tenant_document_ordinal", ["tenant_id", "document_id", "ordinal"])
    .index("by_tenant_citation_id", ["tenant_id", "citation_id"])
    .index("by_tenant_effective", ["tenant_id", "jurisdiction", "effective_from"])
    .index("by_tenant_index_pending", ["tenant_id", "index_pending"]),

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
      selector: v.optional(v.string())
    }),
    snapshot_hash_sha256: v.string(),
    created_at: v.string()
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
      hsm_stub: v.object({ enabled: v.boolean(), key_id: v.string() })
    }),
    citation_ids: v.array(v.string())
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
    hs_candidate: v.string(),
    confidence: v.number(),
    gir_path: v.array(v.string()),
    citation_ids: v.array(v.string()),
    evidence_bundle_id: v.string(),
    created_at: v.string()
  })
    .index("by_tenant_request_id", ["tenant_id", "request_id"])
    .index("by_tenant_status_time", ["tenant_id", "status", "time"])
    .index("by_tenant_corpus_version", ["tenant_id", "corpus_version"])
});

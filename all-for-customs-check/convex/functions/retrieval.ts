// convex/functions/retrieval.ts
import { query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// ---------- helpers (deterministički; bez LLM-a; bez "magije") ----------
function normalizeQuery(q: string): string {
  return q
    .replace(/\s+/g, " ")
    .replace(/[""„"']/g, "")
    .trim();
}

function hsVariants(q: string): string[] {
  // Izvlači 4–10 cifara (HS/TARIC), vraća varijante sa razmacima.
  // Primjeri:
  // 0407199000 -> "0407 19 90 00", "0407 19 90", "0407 19", "0407"
  // 0407 19 90 00 -> zadržava i "kompaktno" i "razmaknuto"
  const cleaned = q.replace(/[^0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const digits = cleaned.replace(/\s+/g, "");
  const out = new Set<string>();

  // već postojeći razmaknuti tokeni (ako ih ima)
  if (cleaned.length) out.add(cleaned);

  // kompaktna cifra sekvenca
  if (/^\d{4,10}$/.test(digits)) {
    out.add(digits);

    const parts: string[] = [];
    // HS 4
    parts.push(digits.slice(0, 4));
    if (digits.length >= 6) parts.push(digits.slice(4, 6));
    if (digits.length >= 8) parts.push(digits.slice(6, 8));
    if (digits.length >= 10) parts.push(digits.slice(8, 10));

    // puni spacing
    out.add(parts.join(" "));

    // prefiksi (za recall)
    out.add(digits.slice(0, 4));
    if (digits.length >= 6) out.add(`${digits.slice(0, 4)} ${digits.slice(4, 6)}`);
    if (digits.length >= 8) out.add(`${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)}`);
    if (digits.length >= 10) out.add(`${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`);
  }

  return Array.from(out).filter(Boolean);
}

function buildQueryVariants(userQ: string): string[] {
  const q = normalizeQuery(userQ);
  const variants = new Set<string>();
  variants.add(q);

  // HS/TARIC varijante
  for (const v of hsVariants(q)) variants.add(v);

  // fallback: strip punctuation
  variants.add(q.replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim());

  // final: izbaci kratke beskorisne
  return Array.from(variants)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2)
    .slice(0, 8); // hard cap: da se ne ubije latency
}

type RetrievalFilters = {
  jurisdiction?: string;
  instrument_type?: string;
  language?: string;
  trust_level?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toIngestionReportDiagnostics(rows: unknown): Array<{
  corpus_version: string;
  counts: { documents: number; citations: number; chunks: number };
  created_at: string;
  source_zip: string;
}> {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r): unknown => r)
    .filter(isRecord)
    .map((r) => {
      const counts = isRecord(r.counts) ? r.counts : {};
      return {
        corpus_version: typeof r.corpus_version === "string" ? r.corpus_version : "",
        counts: {
          documents: typeof counts.documents === "number" ? counts.documents : 0,
          citations: typeof counts.citations === "number" ? counts.citations : 0,
          chunks: typeof counts.chunks === "number" ? counts.chunks : 0,
        },
        created_at: typeof r.created_at === "string" ? r.created_at : "",
        source_zip: typeof r.source_zip === "string" ? r.source_zip : "",
      };
    })
    .filter((r) => r.corpus_version);
}

type HydratedResult = {
  citation?: {
    snapshot_hash_sha256?: string;
    locator?: { page_from?: number; page_to?: number };
  };
  [key: string]: unknown;
};

type RetrievalResponse =
  | {
      ok: true;
      tenant_id: string;
      active_corpus_version: string;
      query_variants: string[];
      results: HydratedResult[];
    }
  | {
      ok: false;
      reason: 'empty_query' | 'no_hits' | 'no_citable_evidence';
      tenant_id?: string;
      active_corpus_version?: string;
      retrieval_diagnostics?: {
        ingestion_reports?: Array<{
          corpus_version: string;
          counts: { documents: number; citations: number; chunks: number };
          created_at: string;
          source_zip: string;
        }>;
      };
      results: [];
    };

// ---------- main endpoint ----------
export const retrieveEvidence = query({
  args: {
    tenant_id: v.string(),
    q: v.string(),
    limit: v.optional(v.number()),

    // filteri (default: none)
    jurisdiction: v.optional(v.string()),
    instrument_type: v.optional(v.string()),
    language: v.optional(v.string()),
    trust_level: v.optional(v.string()),

    // ponašanje
    include_parent: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args
  ): Promise<RetrievalResponse> => {
    const limit = Math.min(Math.max(args.limit ?? 8, 1), 12);
    const include_parent = args.include_parent ?? true;

    const queryText = normalizeQuery(args.q);
    if (!queryText) {
      return { ok: false, reason: "empty_query", results: [] };
    }

    // 1) Enforce active corpus
    const settings: { active_corpus_version: string } = await ctx.runQuery(api.functions.tenant_settings.getTenantSettings, {
      tenant_id: args.tenant_id,
    });
    const activeCorpus = settings.active_corpus_version;

    const filters: RetrievalFilters = {
      jurisdiction: args.jurisdiction,
      instrument_type: args.instrument_type,
      language: args.language,
      trust_level: args.trust_level,
    };

    const variants = buildQueryVariants(queryText);

    // 2) Multi-pass search (strogo ograničeno; bez collect)
    const PER_VARIANT = 18; // bounded
    const rawHits: Array<{
      chunk_id: string;
      document_id: string;
      text: string;
      [key: string]: unknown;
    }> = [];

    for (const vq of variants) {
      const hits = await ctx.db
        .query("chunks")
        .withSearchIndex("search_chunks_text", (s) => {
          let s2 = s
            .search("text", vq)
            .eq("tenant_id", args.tenant_id)
            .eq("corpus_version", activeCorpus);

          if (filters.jurisdiction) s2 = s2.eq("jurisdiction", filters.jurisdiction);
          if (filters.instrument_type) s2 = s2.eq("instrument_type", filters.instrument_type);
          if (filters.language) s2 = s2.eq("language", filters.language);
          if (filters.trust_level) s2 = s2.eq("trust_level", filters.trust_level);

          return s2;
        })
        .take(PER_VARIANT);

      rawHits.push(...hits);
      if (rawHits.length >= 120) break; // hard cap total hits
    }

    if (rawHits.length === 0) {
      const ingestionReports = await ctx.runQuery(api.functions.ingestion_reports.listIngestionReportsByTenant, {
        tenant_id: args.tenant_id,
        limit: 12,
      });

      return {
        ok: false as const,
        reason: "no_hits" as const,
        tenant_id: args.tenant_id,
        active_corpus_version: activeCorpus,
        retrieval_diagnostics: {
          ingestion_reports: toIngestionReportDiagnostics(ingestionReports),
        },
        results: [] as const,
      };
    }

    // 3) Dedup + rank + diversify by document_id
    // Score: earlier hits (from search relevance ordering) get higher score.
    const byChunk = new Map<string, { hit: (typeof rawHits)[0]; score: number }>();
    let rank = 0;

    // boosts: HS code exact match (ako user query sadrži cifre)
    const digitsInQuery = queryText.replace(/\D/g, "");
    const hasDigits = digitsInQuery.length >= 4;

    for (const hit of rawHits) {
      rank += 1;
      const baseScore = 10000 - rank; // relevance proxy
      let boost = 0;

      if (hasDigits) {
        // boost ako se pojavljuje kompaktno ili razmaknuto
        const t = String(hit.text ?? "");
        if (digitsInQuery && t.includes(digitsInQuery)) boost += 500;
        const spaced = hsVariants(digitsInQuery).find((x) => x.includes(" "));
        if (spaced && t.includes(spaced)) boost += 350;
      }

      const score = baseScore + boost;
      const existing = byChunk.get(hit.chunk_id);
      if (!existing || score > existing.score) byChunk.set(hit.chunk_id, { hit, score });
    }

    const sorted = Array.from(byChunk.values()).sort((a, b) => b.score - a.score).map((x) => x.hit);

    // diversify: max 3 per document
    const MAX_PER_DOC = 3;
    const perDoc = new Map<string, number>();
    const selected: string[] = [];
    for (const h of sorted) {
      const docId = String(h.document_id);
      const n = perDoc.get(docId) ?? 0;
      if (n >= MAX_PER_DOC) continue;
      perDoc.set(docId, n + 1);
      selected.push(String(h.chunk_id));
      if (selected.length >= limit) break;
    }

    // 4) Hydrate + hard guardrails (STOP bez dokaza)
    // Koristimo postojeći audit-grade hydrateChunks (enforce_active_corpus default true u tvom repo-u).
    const hydrated = await ctx.runQuery(api.functions.search.hydrateChunks, {
      tenant_id: args.tenant_id,
      chunk_ids: selected,
      include_parent,
      enforce_active_corpus: true,
    });

    // Enforce citation proof (snapshot_hash + page range) na output-u
    const safe = (hydrated as HydratedResult[]).filter((r) => {
      const c = r?.citation;
      return Boolean(c?.snapshot_hash_sha256 && c?.locator?.page_from && c?.locator?.page_to);
    });

    if (safe.length === 0) {
      const ingestionReports = await ctx.runQuery(api.functions.ingestion_reports.listIngestionReportsByTenant, {
        tenant_id: args.tenant_id,
        limit: 12,
      });

      return {
        ok: false as const,
        reason: "no_citable_evidence" as const,
        tenant_id: args.tenant_id,
        active_corpus_version: activeCorpus,
        retrieval_diagnostics: {
          ingestion_reports: toIngestionReportDiagnostics(ingestionReports),
        },
        results: [] as const,
      };
    }

    return {
      ok: true as const,
      tenant_id: args.tenant_id,
      active_corpus_version: activeCorpus,
      query_variants: variants,
      results: safe,
    };
  },
});

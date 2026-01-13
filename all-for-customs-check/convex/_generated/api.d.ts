/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_chunks from "../functions/chunks.js";
import type * as functions_citations from "../functions/citations.js";
import type * as functions_decisions from "../functions/decisions.js";
import type * as functions_documents from "../functions/documents.js";
import type * as functions_hs_codes from "../functions/hs_codes.js";
import type * as functions_indexing_worker from "../functions/indexing_worker.js";
import type * as functions_ingestion_reports from "../functions/ingestion_reports.js";
import type * as functions_ingestion_runs from "../functions/ingestion_runs.js";
import type * as functions_ingestion_worker from "../functions/ingestion_worker.js";
import type * as functions_retrieval from "../functions/retrieval.js";
import type * as functions_search from "../functions/search.js";
import type * as functions_sources from "../functions/sources.js";
import type * as functions_tenant_settings from "../functions/tenant_settings.js";
import type * as hash from "../hash.js";
import type * as health from "../health.js";
import type * as idUtils from "../idUtils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "functions/chunks": typeof functions_chunks;
  "functions/citations": typeof functions_citations;
  "functions/decisions": typeof functions_decisions;
  "functions/documents": typeof functions_documents;
  "functions/hs_codes": typeof functions_hs_codes;
  "functions/indexing_worker": typeof functions_indexing_worker;
  "functions/ingestion_reports": typeof functions_ingestion_reports;
  "functions/ingestion_runs": typeof functions_ingestion_runs;
  "functions/ingestion_worker": typeof functions_ingestion_worker;
  "functions/retrieval": typeof functions_retrieval;
  "functions/search": typeof functions_search;
  "functions/sources": typeof functions_sources;
  "functions/tenant_settings": typeof functions_tenant_settings;
  hash: typeof hash;
  health: typeof health;
  idUtils: typeof idUtils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

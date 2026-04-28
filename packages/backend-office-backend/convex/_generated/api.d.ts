/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as data_alertHistory from "../data/alertHistory.js";
import type * as data_auditLogs from "../data/auditLogs.js";
import type * as data_providerFailureLog from "../data/providerFailureLog.js";
import type * as data_providerHealthChecks from "../data/providerHealthChecks.js";
import type * as lib_alertDispatcher from "../lib/alertDispatcher.js";
import type * as lib_alertThresholds from "../lib/alertThresholds.js";
import type * as lib_jobStatus from "../lib/jobStatus.js";
import type * as lib_monitoring from "../lib/monitoring.js";
import type * as lib_promptContext from "../lib/promptContext.js";
import type * as lib_providerFailures from "../lib/providerFailures.js";
import type * as lib_themes from "../lib/themes.js";
import type * as lib_validators from "../lib/validators.js";
import type * as monitoring from "../monitoring.js";
import type * as monitoring_authAnomaly from "../monitoring/authAnomaly.js";
import type * as monitoring_registry from "../monitoring/registry.js";
import type * as monitoring_stubs from "../monitoring/stubs.js";
import type * as providers_ai from "../providers/ai.js";
import type * as providers_claude from "../providers/claude.js";
import type * as providers_deepgram from "../providers/deepgram.js";
import type * as providers_index from "../providers/index.js";
import type * as providers_payments from "../providers/payments.js";
import type * as providers_pricing from "../providers/pricing.js";
import type * as providers_pricingStub from "../providers/pricingStub.js";
import type * as providers_stripe from "../providers/stripe.js";
import type * as providers_stt from "../providers/stt.js";
import type * as providers_telephony from "../providers/telephony.js";
import type * as providers_twilio from "../providers/twilio.js";
import type * as providers_types from "../providers/types.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  "data/alertHistory": typeof data_alertHistory;
  "data/auditLogs": typeof data_auditLogs;
  "data/providerFailureLog": typeof data_providerFailureLog;
  "data/providerHealthChecks": typeof data_providerHealthChecks;
  "lib/alertDispatcher": typeof lib_alertDispatcher;
  "lib/alertThresholds": typeof lib_alertThresholds;
  "lib/jobStatus": typeof lib_jobStatus;
  "lib/monitoring": typeof lib_monitoring;
  "lib/promptContext": typeof lib_promptContext;
  "lib/providerFailures": typeof lib_providerFailures;
  "lib/themes": typeof lib_themes;
  "lib/validators": typeof lib_validators;
  monitoring: typeof monitoring;
  "monitoring/authAnomaly": typeof monitoring_authAnomaly;
  "monitoring/registry": typeof monitoring_registry;
  "monitoring/stubs": typeof monitoring_stubs;
  "providers/ai": typeof providers_ai;
  "providers/claude": typeof providers_claude;
  "providers/deepgram": typeof providers_deepgram;
  "providers/index": typeof providers_index;
  "providers/payments": typeof providers_payments;
  "providers/pricing": typeof providers_pricing;
  "providers/pricingStub": typeof providers_pricingStub;
  "providers/stripe": typeof providers_stripe;
  "providers/stt": typeof providers_stt;
  "providers/telephony": typeof providers_telephony;
  "providers/twilio": typeof providers_twilio;
  "providers/types": typeof providers_types;
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

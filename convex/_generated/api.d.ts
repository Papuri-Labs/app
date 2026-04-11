/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as assignments from "../assignments.js";
import type * as attendance from "../attendance.js";
import type * as budgets from "../budgets.js";
import type * as bulletins from "../bulletins.js";
import type * as clerk from "../clerk.js";
import type * as debug from "../debug.js";
import type * as events from "../events.js";
import type * as expenses from "../expenses.js";
import type * as funds from "../funds.js";
import type * as giving from "../giving.js";
import type * as givingTransactions from "../givingTransactions.js";
import type * as giving_options from "../giving_options.js";
import type * as ledger from "../ledger.js";
import type * as logs from "../logs.js";
import type * as media from "../media.js";
import type * as media_actions from "../media_actions.js";
import type * as migrations_001_add_organizations from "../migrations/001_add_organizations.js";
import type * as ministries from "../ministries.js";
import type * as onboarding from "../onboarding.js";
import type * as organizations from "../organizations.js";
import type * as permissions from "../permissions.js";
import type * as prayer_requests from "../prayer_requests.js";
import type * as services from "../services.js";
import type * as settings from "../settings.js";
import type * as test_sync from "../test_sync.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  assignments: typeof assignments;
  attendance: typeof attendance;
  budgets: typeof budgets;
  bulletins: typeof bulletins;
  clerk: typeof clerk;
  debug: typeof debug;
  events: typeof events;
  expenses: typeof expenses;
  funds: typeof funds;
  giving: typeof giving;
  givingTransactions: typeof givingTransactions;
  giving_options: typeof giving_options;
  ledger: typeof ledger;
  logs: typeof logs;
  media: typeof media;
  media_actions: typeof media_actions;
  "migrations/001_add_organizations": typeof migrations_001_add_organizations;
  ministries: typeof ministries;
  onboarding: typeof onboarding;
  organizations: typeof organizations;
  permissions: typeof permissions;
  prayer_requests: typeof prayer_requests;
  services: typeof services;
  settings: typeof settings;
  test_sync: typeof test_sync;
  users: typeof users;
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

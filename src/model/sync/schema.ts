/**
 * Yjs Schema Type Definitions for ContextFlow
 *
 * This file defines TypeScript types that describe how Project data structures
 * are stored in Yjs Y.Map and Y.Array structures for real-time collaboration.
 *
 * Key Design Pattern: Nested Y.Map Objects
 * ========================================
 * For hierarchical data like BoundedContext.positions, we use nested Y.Map objects
 * (NOT dot-notation string keys like 'positions.flow.x').
 *
 * Why nested Y.Map?
 * - Preserves CRDT conflict resolution at each level
 * - Allows fine-grained observation of nested changes
 * - Idiomatic Yjs pattern used by production apps
 *
 * Example:
 *   ✅ CORRECT: Nested Y.Map objects
 *   const ypositions = new Y.Map();
 *   const yflow = new Y.Map();
 *   yflow.set('x', 100);
 *   yflow.set('y', 200);
 *   ypositions.set('flow', yflow);
 *   ycontext.set('positions', ypositions);
 *
 *   ❌ WRONG: Dot-notation keys (loses CRDT benefits)
 *   ycontext.set('positions.flow.x', 100);
 *
 * Convention for Optional/Nullable Fields:
 * ========================================
 * Use `null` in Yjs for absent optional fields, not `undefined`.
 * This ensures proper CRDT behavior and serialization.
 *
 * Example:
 *   ycontext.set('purpose', context.purpose ?? null);
 */

import * as Y from 'yjs';
import type {
  Project,
  BoundedContext,
  Relationship,
  Group,
  Repo,
  Person,
  Team,
  FlowStageMarker,
  User,
  UserNeed,
  UserNeedConnection,
  NeedContextConnection,
  TemporalKeyframe,
  Issue,
  ContributorRef,
} from '../types';

/**
 * Root Yjs document structure for a ContextFlow project.
 *
 * The root Y.Doc contains a single Y.Map named 'project' with these fields:
 * - Scalar fields (id, name, version, etc.) stored directly
 * - Entity arrays stored as Y.Array<Y.Map<unknown>>
 * - Nested config objects stored as nested Y.Map
 */
export interface YjsProject {
  // Scalar metadata fields
  id: string;
  name: string;
  version?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  // Entity arrays (each element is a Y.Map)
  contexts: Y.Array<Y.Map<unknown>>; // Array of YjsBoundedContext
  relationships: Y.Array<Y.Map<unknown>>; // Array of YjsRelationship
  repos: Y.Array<Y.Map<unknown>>; // Array of YjsRepo
  people: Y.Array<Y.Map<unknown>>; // Array of YjsPerson
  teams: Y.Array<Y.Map<unknown>>; // Array of YjsTeam
  groups: Y.Array<Y.Map<unknown>>; // Array of YjsGroup
  users: Y.Array<Y.Map<unknown>>; // Array of YjsUser
  userNeeds: Y.Array<Y.Map<unknown>>; // Array of YjsUserNeed
  userNeedConnections: Y.Array<Y.Map<unknown>>; // Array of YjsUserNeedConnection
  needContextConnections: Y.Array<Y.Map<unknown>>; // Array of YjsNeedContextConnection

  // Nested config objects
  viewConfig: Y.Map<unknown>; // YjsViewConfig
  temporal?: Y.Map<unknown> | null; // YjsTemporal
}

/**
 * Yjs representation of a BoundedContext.
 *
 * Uses nested Y.Map for positions to preserve CRDT resolution.
 */
export interface YjsBoundedContext {
  // Scalar fields
  id: string;
  name: string;
  purpose?: string | null;
  strategicClassification?: 'core' | 'supporting' | 'generic' | null;
  ownership?: 'ours' | 'internal' | 'external' | null;
  boundaryIntegrity?: 'strong' | 'moderate' | 'weak' | null;
  boundaryNotes?: string | null;
  evolutionStage: 'genesis' | 'custom-built' | 'product/rental' | 'commodity/utility';
  isLegacy?: boolean;
  notes?: string | null;
  teamId?: string | null;

  // Nested position structure (use nested Y.Map)
  positions: Y.Map<unknown>; // YjsPositions

  // Nested codeSize (optional)
  codeSize?: Y.Map<unknown> | null; // YjsCodeSize

  // Issues array
  issues?: Y.Array<Y.Map<unknown>> | null; // Array of YjsIssue
}

/**
 * Nested positions structure for BoundedContext.
 * Each position view (strategic, flow, distillation, shared) is a nested Y.Map.
 */
export interface YjsPositions {
  strategic: Y.Map<unknown>; // { x: number }
  flow: Y.Map<unknown>; // { x: number }
  distillation: Y.Map<unknown>; // { x: number, y: number }
  shared: Y.Map<unknown>; // { y: number }
}

/**
 * Yjs representation of codeSize (optional nested object).
 */
export interface YjsCodeSize {
  loc?: number | null;
  bucket?: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | null;
}

/**
 * Yjs representation of an Issue.
 */
export interface YjsIssue {
  id: string;
  title: string;
  description?: string | null;
  severity: 'info' | 'warning' | 'critical';
}

/**
 * Yjs representation of a Relationship.
 */
export interface YjsRelationship {
  id: string;
  fromContextId: string;
  toContextId: string;
  pattern:
    | 'customer-supplier'
    | 'conformist'
    | 'anti-corruption-layer'
    | 'open-host-service'
    | 'published-language'
    | 'shared-kernel'
    | 'partnership'
    | 'separate-ways';
  communicationMode?: string | null;
  description?: string | null;
}

/**
 * Yjs representation of a Group (capability cluster).
 */
export interface YjsGroup {
  id: string;
  label: string;
  color?: string | null;
  contextIds: Y.Array<string>; // Array of context IDs
  notes?: string | null;
}

/**
 * Yjs representation of a Repo.
 */
export interface YjsRepo {
  id: string;
  name: string;
  remoteUrl?: string | null;
  contextId?: string | null;
  teamIds: Y.Array<string>; // Array of team IDs
  contributors: Y.Array<Y.Map<unknown>>; // Array of YjsContributorRef
  analysisSummary?: string | null;
}

/**
 * Yjs representation of a ContributorRef.
 */
export interface YjsContributorRef {
  personId: string;
}

/**
 * Yjs representation of a Person.
 */
export interface YjsPerson {
  id: string;
  displayName: string;
  emails: Y.Array<string>; // Array of email strings
  teamIds?: Y.Array<string> | null; // Array of team IDs
}

/**
 * Yjs representation of a Team.
 */
export interface YjsTeam {
  id: string;
  name: string;
  jiraBoard?: string | null;
  topologyType?:
    | 'stream-aligned'
    | 'platform'
    | 'enabling'
    | 'complicated-subsystem'
    | 'unknown'
    | null;
}

/**
 * Yjs representation of a FlowStageMarker.
 */
export interface YjsFlowStageMarker {
  name: string;
  position: number;
  description?: string | null;
  owner?: string | null;
  notes?: string | null;
}

/**
 * Yjs representation of viewConfig.
 */
export interface YjsViewConfig {
  flowStages: Y.Array<Y.Map<unknown>>; // Array of YjsFlowStageMarker
}

/**
 * Yjs representation of a User (Strategic View).
 */
export interface YjsUser {
  id: string;
  name: string;
  description?: string | null;
  position: number;
  isExternal?: boolean;
}

/**
 * Yjs representation of a UserNeed.
 */
export interface YjsUserNeed {
  id: string;
  name: string;
  description?: string | null;
  position: number;
  visibility?: boolean;
}

/**
 * Yjs representation of a UserNeedConnection.
 */
export interface YjsUserNeedConnection {
  id: string;
  userId: string;
  userNeedId: string;
  notes?: string | null;
}

/**
 * Yjs representation of a NeedContextConnection.
 */
export interface YjsNeedContextConnection {
  id: string;
  userNeedId: string;
  contextId: string;
  notes?: string | null;
}

/**
 * Yjs representation of temporal configuration.
 */
export interface YjsTemporal {
  enabled: boolean;
  keyframes: Y.Array<Y.Map<unknown>>; // Array of YjsTemporalKeyframe
}

/**
 * Yjs representation of a TemporalKeyframe.
 *
 * Positions use a Y.Map with dynamic contextId keys, where each value is a nested Y.Map
 * containing { x: number, y: number }.
 */
export interface YjsTemporalKeyframe {
  id: string;
  date: string;
  label?: string | null;

  // Positions stored as Y.Map<Y.Map<unknown>>
  // Key: contextId (string)
  // Value: Y.Map with { x: number, y: number }
  positions: Y.Map<Y.Map<unknown>>;

  // Active context IDs
  activeContextIds: Y.Array<string>;
}

/**
 * Type guard to check if a value is a Y.Map.
 */
export function isYMap(value: unknown): value is Y.Map<unknown> {
  return value instanceof Y.Map;
}

/**
 * Type guard to check if a value is a Y.Array.
 */
export function isYArray(value: unknown): value is Y.Array<unknown> {
  return value instanceof Y.Array;
}

/**
 * Type guard to check if a value is a Y.Doc.
 */
export function isYDoc(value: unknown): value is Y.Doc {
  return value instanceof Y.Doc;
}

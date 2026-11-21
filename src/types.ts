export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface RequestOptions {
  brainId?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export interface IdentificationParams {
  name: string;
  entity_types?: string[];
  [key: string]: unknown;
}

export interface Node {
  uuid?: string;
  labels: string[];
  name: string;
  description?: string | null;
  properties?: Record<string, unknown>;
  polarity?: "positive" | "negative" | "neutral" | null;
  metadata?: Record<string, unknown> | null;
  happened_at?: string | null;
  last_updated?: string;
  observations?: Observation[] | null;
  verification_state?: FactVerificationState;
}

export interface Predicate {
  uuid?: string;
  name: string;
  description: string;
  flow_key?: string | null;
  last_updated?: string;
  deprecated?: boolean;
  direction?: "in" | "out" | "neutral" | null;
  amount?: number | null;
  observations?: Observation[] | null;
  properties?: Record<string, unknown>;
  level?: "1" | "2" | "3" | null;
  verification_state?: FactVerificationState;
  verified_by?: string | null;
  verified_at?: string | null;
  verification_source?: string | null;
}

export interface Observation {
  uuid?: string;
  label?: string;
  text?: string;
  content?: string;
  [key: string]: unknown;
}

export interface IngestionTaskTextArgs {
  data_type?: "text";
  text_data: string;
}

export interface IngestionTaskJsonArgs {
  data_type?: "json";
  json_data: Record<string, unknown>;
}

export interface IngestTextRequest {
  data?: IngestionTaskTextArgs | IngestionTaskJsonArgs;
  text?: string;
  meta_keys?: Record<string, unknown> | null;
  identification_params?: Record<string, unknown> | null;
  observate_for?: string[] | null;
  preferred_extraction_entities?: string[] | null;
  brain_id?: string;
  source_timestamp?: string | null;
  skip_enrichment?: boolean;
  group_tracking?: string | null;
}

export interface IngestJsonRequest extends Omit<IngestTextRequest, "text" | "data"> {
  json_data: Record<string, unknown>;
  data?: IngestionTaskJsonArgs;
}

export interface IngestUrlRequest {
  url: string;
  progressive?: boolean;
  max_pages?: number;
  allowed_domains?: string[];
  allowed_path_prefixes?: string[];
  group_tracking?: string | null;
  skip_enrichment?: boolean;
}

export interface RequestPartialNode {
  uuid?: string | null;
  type: string;
  name?: string;
  labels?: string[] | null;
  description?: string | null;
  properties?: Record<string, unknown> | null;
}

export interface RequestPartialPredicate {
  name?: string;
  description?: string | null;
  properties?: Record<string, unknown> | null;
}

export interface IngestionTripleSet {
  subject?: RequestPartialNode | null;
  subj_event?: RequestPartialPredicate | null;
  event?: RequestPartialNode | null;
  event_obj?: RequestPartialPredicate | null;
  object: RequestPartialNode;
}

export interface PartialNodeFilter {
  name?: string | null;
  type?: string | null;
  uuid?: string | null;
  labels?: string[] | null;
}

export interface IngestStructuredRequest {
  data: IngestionTripleSet[];
  anchor?: PartialNodeFilter | null;
  text?: string | null;
  mode?: "deterministic" | "hybrid" | "enrich" | null;
  brain_id?: string;
  group_tracking?: string | null;
}

export interface IngestFileRequest {
  file: Blob | File;
  filename?: string;
  contentType?: string;
  group_tracking?: string | null;
  brain_id?: string;
}

export interface IngestionAcceptedResponse {
  message: string;
  task_id: string;
}

export interface GetContextRequest {
  text: string;
  brain_id?: string;
  as_of?: string | null;
  include_validity_unknown?: boolean;
  annotate_conflicts?: boolean;
  include_history?: boolean | null;
  historical_limit?: number;
  max_facts?: number;
  max_passages?: number;
  apply_fact_filter?: boolean;
  use_ppr?: boolean;
  sufficiency_retry?: boolean;
  profile_stages?: boolean;
  cross_event_bridges?: number;
  include_rejected?: boolean;
}

export type ContextTripleTuple = [Node, Predicate, Node, Predicate, Node];

export interface GetContextTriple {
  identified_entity: string;
  triple: ContextTripleTuple;
  source_chunk_ids?: string[] | null;
  source_session_ids?: string[] | null;
  open_conflicts?: Array<Record<string, unknown>> | null;
  verification?: FactVerificationInfo | null;
}

export interface GetContextResponse {
  text_context: string;
  triples: GetContextTriple[];
  historical_context?: string[];
  source_passages?: string[];
  graph_session_ids?: string[] | null;
  temporal_conflicts?: Array<Record<string, unknown>> | null;
  paths?: Array<Record<string, unknown>> | null;
  topics?: Array<Record<string, unknown>> | null;
  stage_timings?: Record<string, unknown> | null;
  validity_unknown_count?: number | null;
  validity_unknown?: Array<Record<string, unknown>> | null;
}

export interface SearchRequest {
  query: string;
  brain_id?: string;
  as_of?: string | null;
  include_validity_unknown?: boolean;
  k?: number;
  channels?: string[] | string;
  node_labels?: string[] | string | null;
  community_labels?: string[] | string | null;
  expand?: "none" | "neighbors";
  fusion?: "rrf" | "cc" | null;
  fusion_alpha?: number | null;
  rerank?: string | null;
  mode?: "default" | "catalog";
  profile_stages?: boolean;
  extras?: Record<string, string> | null;
  target?: string | null;
  include_rejected?: boolean;
}

export interface SearchHitScores {
  [key: string]: number | undefined;
}

export interface SearchHit {
  id: string;
  channel: string;
  score: number;
  scores: SearchHitScores;
  snippet: string;
  labels?: string[];
  extras?: Record<string, unknown> | null;
  node_id?: string | null;
}

export interface SearchResponse {
  hits: SearchHit[];
  stage_timings?: Record<string, unknown> | null;
  channel_lists?: Record<string, string[]> | null;
  facets?: Record<string, Record<string, number>> | null;
  node_ids?: string[];
  validity_unknown_count?: number | null;
  validity_unknown?: Array<Record<string, unknown>> | null;
}

export interface RetrieveRequest {
  text: string;
  limit?: number;
  preferred_entities?: string;
  include_rejected?: boolean;
  as_of?: string | null;
  include_validity_unknown?: boolean;
}

export interface RetrieveRequestResponse {
  [key: string]: unknown;
}

export interface EntityStatusRequest {
  target: string;
  types?: string[];
}

export interface GetEntityStatusResponse {
  node?: Node | null;
  exists: boolean;
  has_relationships: boolean;
  relationships: Array<[Predicate, Node]> | unknown[];
  observations: Observation[];
}

export interface GetEntityInfoResponse {
  [key: string]: unknown;
}

export interface GetEntityContextResponse {
  [key: string]: unknown;
}

export interface EntitySynergiesRequest {
  target: string;
  top_k?: number;
  labels?: string;
  polarity?: "same" | "opposite";
}

export interface RecommendRequest {
  target: string;
  brain_id?: string;
  polarity?: "same" | "opposite";
  top_k?: number;
  labels?: string[] | null;
  include_asymmetric?: boolean;
  include_multi_interest?: boolean;
  include_attribute_pref?: boolean;
  diversify?: boolean;
  asymmetric_direction?: "outbound" | "inbound" | "both";
  exclude_seen?: boolean;
  recency_half_life_days?: number | null;
  dampen_degree?: boolean;
  behavior_weights?: Record<string, number> | null;
}

export interface RecommendItem {
  node: Node;
  score: number;
  connected_by: Node[];
  channel: string;
}

export interface RecommendResponse {
  target_node: Node;
  recommendations: RecommendItem[];
}

export interface NeighborsRequest {
  entity_id?: string;
  identification_params?: IdentificationParams;
  looking_for?: string;
  limit?: number;
  include_rejected?: boolean;
}

export interface ListQuery {
  limit?: number;
  skip?: number;
  include_rejected?: boolean;
}

export interface RelationshipListQuery extends ListQuery {
  relationship_types?: string;
  from_node_labels?: string;
}

export interface ChangelogListQuery extends ListQuery {
  types?: string;
  since?: string;
  until?: string;
}

export interface ObservationListQuery extends ListQuery {
  labels?: string;
}

export interface StructuredDataListQuery extends ListQuery {
  types?: string;
}

export interface RelationshipListResponse {
  message: string;
  relationships: unknown[];
  total: number;
}

export interface EntityListResponse {
  message: string;
  entities: Node[];
  total: number;
}

export interface ObservationListResponse {
  message: string;
  observations: Observation[];
  count: number;
}

export interface ObservationItemResponse {
  message: string;
  observation: Observation;
}

export interface TextChunkListResponse {
  message: string;
  data: unknown[];
  total: number;
}

export interface StructuredDataListResponse {
  message: string;
  data: unknown[];
  count: number;
  total: number;
}

export interface StructuredDataItemResponse {
  message: string;
  data: unknown;
}

export interface TypeListResponse {
  message: string;
  types: string[];
  count: number;
}

export interface LabelListResponse {
  message: string;
  labels: string[];
  count: number;
}

export interface ChangelogListResponse {
  message: string;
  changelogs: unknown[];
  count: number;
  changes?: unknown[] | null;
  total?: number | null;
  since?: string | null;
  until?: string | null;
}

export interface ChangelogItemResponse {
  message: string;
  changelog: unknown;
}

export type FactVerificationState = "unverified" | "verified" | "rejected";

export interface FactVerificationInfo {
  state: FactVerificationState;
  verified_by?: string | null;
  verified_at?: string | null;
  verification_source?: string | null;
  note?: string | null;
}

export interface FactVerificationHistoryEntry {
  id: string;
  from_state: FactVerificationState;
  to_state: FactVerificationState;
  verified_by?: string | null;
  verified_at: string;
  verification_source?: string | null;
  note?: string | null;
}

export interface FactVerificationRecord {
  kind: "relationship" | "node";
  fact_id: string;
  name?: string;
  description?: string;
  verification: FactVerificationInfo;
  history?: FactVerificationHistoryEntry[];
  subject_uuid?: string | null;
  subject_name?: string | null;
  subject_labels?: string[];
  object_uuid?: string | null;
  object_name?: string | null;
  [key: string]: unknown;
}

export interface FactVerificationListResponse {
  facts: FactVerificationRecord[];
  total: number;
  count?: number;
}

export interface ListFactsQuery {
  state?: FactVerificationState | string | null;
  include_rejected?: boolean;
  limit?: number;
  skip?: number;
}

export interface VerifyFactRequest {
  verified_by?: string | null;
  verification_source?: string | null;
  note?: string | null;
}

export interface ConflictRecord {
  id?: string;
  status?: string;
  subject?: string;
  [key: string]: unknown;
}

export interface ConflictListQuery {
  limit?: number;
  skip?: number;
  status?: "open" | "resolved" | "dismissed" | string | null;
  source?: string | null;
  subject?: string | null;
  since?: string | null;
  until?: string | null;
}

export interface ConflictListResponse {
  message: string;
  conflicts: ConflictRecord[];
  count: number;
  total: number;
}

export interface ConflictItemResponse {
  message: string;
  conflict: ConflictRecord;
}

export interface ConflictReportQuery extends ConflictListQuery {
  format?: "json" | "markdown";
}

export interface ConflictReportResponse {
  message: string;
  summary: Record<string, unknown>;
  conflicts: ConflictRecord[];
  markdown?: string | null;
}

export interface ConflictScanRequest {
  use_llm?: boolean;
}

export interface ConflictScanAcceptedResponse {
  message: string;
  task_id: string;
}

export interface ConflictResolveRequest {
  winning_fact_id?: string | null;
  notes?: string | null;
  method?: string | null;
}

export interface ConflictDismissRequest {
  notes?: string | null;
}

export interface AddEntityRequest {
  name: string;
  brain_id?: string;
  labels?: string[];
  description?: string | null;
  properties?: Record<string, unknown> | null;
  identification_params?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateEntityRequest {
  uuid: string;
  brain_id?: string;
  new_name?: string | null;
  new_description?: string | null;
  new_labels?: string[] | null;
  new_properties?: Record<string, unknown> | null;
  properties_to_remove?: string[] | null;
}

export interface AddRelationshipRequest {
  subject_uuid: string;
  predicate_name: string;
  predicate_description: string;
  object_uuid: string;
  brain_id?: string;
}

export interface UpdateRelationshipRequest {
  uuid: string;
  brain_id?: string;
  new_properties?: Record<string, unknown> | null;
  properties_to_remove?: string[] | null;
}

export interface TaskStateResponse {
  task_id?: string | null;
  id?: string | null;
  status: string;
  stage?: string | null;
  error?: string | null;
  result?: unknown;
  cancellation_modes?: string[];
  [key: string]: unknown;
}

export interface TaskListResponse {
  tasks: TaskStateResponse[];
}

export interface CancelIngestionRequest {
  mode: "keep_saved" | "rollback";
}

export interface CancelIngestionResponse {
  task_id: string;
  mode: "keep_saved" | "rollback";
  status: "cancelling" | "cancelled" | "rollback_failed";
}

export interface PurgeIngestionRequest {
  digest?: string | null;
  source_key?: string | null;
}

export interface WaitForTaskOptions extends RequestOptions {
  intervalMs?: number;
  timeoutMs?: number;
  poll?: (task: TaskStateResponse) => boolean | void;
}

export interface Brain {
  id?: string;
  name_key: string;
  pat?: string;
}

export interface CreateBrainRequest {
  brain_id: string;
}

export interface BrainLifecycleResponse {
  success: boolean;
  brain_id: string;
  operation: "clear" | "delete";
  existed: boolean;
  cleared_backends: string[];
}

export interface LoginInfoResponse {
  is_system_pat: boolean;
  brain_id: string;
}

export interface HealthResponse {
  status?: string;
  [key: string]: unknown;
}

export interface IngestionCapabilitiesResponse {
  progressive: boolean;
  version: string;
  concurrency: number;
}

export interface VectorStoreListResponse {
  stores: Array<{ name: string; dimension: number }>;
}

export interface VectorListResponse {
  message: string;
  store: string;
  vectors: unknown[];
  total: number;
}

export interface IngestGroupMeterResponse {
  group_tracking: string;
  task_count: number;
  completed: number;
  failed: number;
  [key: string]: unknown;
}

import {
  resolveBaseUrl,
  resolveBrainId,
  resolvePat,
  type BrainAPIClientOptions,
} from "./config";
import { BrainAPIError } from "./errors";
import { HttpClient, type HttpRequestOptions } from "./http";
import type {
  AddEntityRequest,
  AddRelationshipRequest,
  Brain,
  BrainLifecycleResponse,
  CancelIngestionRequest,
  CancelIngestionResponse,
  ChangelogItemResponse,
  ChangelogListQuery,
  ChangelogListResponse,
  ConflictDismissRequest,
  ConflictItemResponse,
  ConflictListQuery,
  ConflictListResponse,
  ConflictReportQuery,
  ConflictReportResponse,
  ConflictResolveRequest,
  ConflictScanAcceptedResponse,
  ConflictScanRequest,
  CreateBrainRequest,
  EntityListResponse,
  EntityStatusRequest,
  EntitySynergiesRequest,
  FactVerificationListResponse,
  FactVerificationRecord,
  GetContextRequest,
  GetContextResponse,
  GetEntityContextResponse,
  GetEntityInfoResponse,
  GetEntityStatusResponse,
  HealthResponse,
  IngestFileRequest,
  IngestGroupMeterResponse,
  IngestJsonRequest,
  IngestStructuredRequest,
  IngestTextRequest,
  IngestUrlRequest,
  IngestionAcceptedResponse,
  IngestionCapabilitiesResponse,
  LabelListResponse,
  ListFactsQuery,
  ListQuery,
  LoginInfoResponse,
  NeighborsRequest,
  ObservationItemResponse,
  ObservationListQuery,
  ObservationListResponse,
  PurgeIngestionRequest,
  RecommendRequest,
  RecommendResponse,
  RelationshipListQuery,
  RelationshipListResponse,
  RequestOptions,
  RetrieveRequest,
  RetrieveRequestResponse,
  SearchRequest,
  SearchResponse,
  StructuredDataItemResponse,
  StructuredDataListQuery,
  StructuredDataListResponse,
  TaskListResponse,
  TaskStateResponse,
  TextChunkListResponse,
  TypeListResponse,
  UpdateEntityRequest,
  UpdateRelationshipRequest,
  VectorListResponse,
  VectorStoreListResponse,
  VerifyFactRequest,
  WaitForTaskOptions,
} from "./types";

const TERMINAL_TASK_STATUSES = new Set([
  "completed",
  "failed",
  "cancelled",
  "canceled",
  "rollback_failed",
  "success",
  "error",
]);

export class BrainAPI {
  readonly baseUrl: string;
  readonly brainId: string;
  readonly authScheme: NonNullable<BrainAPIClientOptions["authScheme"]>;

  private readonly http: HttpClient;
  private readonly options: BrainAPIClientOptions;

  constructor(options: BrainAPIClientOptions) {
    this.options = options;
    const pat = resolvePat(options.pat);
    this.baseUrl = resolveBaseUrl({
      baseUrl: options.baseUrl,
      region: options.region,
    });
    this.brainId = resolveBrainId(options.brainId);
    this.authScheme = options.authScheme ?? "both";
    this.http = new HttpClient(
      this.baseUrl,
      pat,
      this.brainId,
      this.authScheme,
      options.fetch ?? globalThis.fetch.bind(globalThis),
      options.timeoutMs,
      options.userAgent ?? `@lumenlabs/lumen-brain/2.0.0`,
    );
  }

  async request<T>(options: HttpRequestOptions): Promise<T> {
    return this.http.request<T>(options);
  }

  withBrain(brainId: string): BrainAPI {
    return new BrainAPI({
      ...this.options,
      brainId,
      baseUrl: this.baseUrl,
      region: undefined,
      authScheme: this.authScheme,
    });
  }

  readonly ingest = {
    text: (input: string | IngestTextRequest, options?: RequestOptions) =>
      this.ingestText(input, options),
    json: (input: IngestJsonRequest, options?: RequestOptions) =>
      this.ingestJson(input, options),
    url: (input: string | IngestUrlRequest, options?: RequestOptions) =>
      this.ingestUrl(input, options),
    file: (input: IngestFileRequest, options?: RequestOptions) =>
      this.ingestFile(input, options),
    structured: (input: IngestStructuredRequest, options?: RequestOptions) =>
      this.ingestStructured(input, options),
    structuredBatch: (input: IngestStructuredRequest, options?: RequestOptions) =>
      this.ingestStructuredBatch(input, options),
  };

  readonly retrieve = {
    context: (input: GetContextRequest, options?: RequestOptions) =>
      this.getContext(input, options),
    search: (input: SearchRequest, options?: RequestOptions) =>
      this.search(input, options),
    searchGet: (input: SearchRequest, options?: RequestOptions) =>
      this.searchGet(input, options),
    query: (input: RetrieveRequest, options?: RequestOptions) =>
      this.retrieveQuery(input, options),
    entityStatus: (input: string | EntityStatusRequest, options?: RequestOptions) =>
      this.getEntityStatus(input, options),
    entityInfo: (
      query: Record<string, string | number | boolean | undefined>,
      options?: RequestOptions,
    ) =>
      this.request<GetEntityInfoResponse>({
        path: "/retrieve/entity/info",
        query,
        ...options,
      }),
    entityContext: (
      query: Record<string, string | number | boolean | undefined>,
      options?: RequestOptions,
    ) =>
      this.request<GetEntityContextResponse>({
        path: "/retrieve/entity/context",
        query,
        ...options,
      }),
    synergies: (input: EntitySynergiesRequest, options?: RequestOptions) =>
      this.request<unknown>({
        path: "/retrieve/entity/synergies",
        query: {
          target: input.target,
          top_k: input.top_k,
          labels: input.labels,
          polarity: input.polarity,
        },
        ...options,
      }),
    recommend: (input: RecommendRequest, options?: RequestOptions) =>
      this.recommend(input, options),
    neighbors: (input: NeighborsRequest, options?: RequestOptions) =>
      this.getNeighbors(input, options),
    relationships: (query?: RelationshipListQuery, options?: RequestOptions) =>
      this.request<RelationshipListResponse>({
        path: "/retrieve/relationships",
        query,
        ...options,
      }),
    entities: (query?: ListQuery, options?: RequestOptions) =>
      this.request<EntityListResponse>({
        path: "/retrieve/entities",
        query,
        ...options,
      }),
    observations: (query?: ObservationListQuery, options?: RequestOptions) =>
      this.request<ObservationListResponse>({
        path: "/retrieve/observations",
        query,
        ...options,
      }),
    observation: (id: string, options?: RequestOptions) =>
      this.request<ObservationItemResponse>({
        path: `/retrieve/observations/${encodeURIComponent(id)}`,
        ...options,
      }),
    observationLabels: (options?: RequestOptions) =>
      this.request<LabelListResponse>({
        path: "/retrieve/observations/labels",
        ...options,
      }),
    textChunks: (query?: ListQuery, options?: RequestOptions) =>
      this.request<TextChunkListResponse>({
        path: "/retrieve/text-chunks",
        query,
        ...options,
      }),
    structuredData: (query?: StructuredDataListQuery, options?: RequestOptions) =>
      this.request<StructuredDataListResponse>({
        path: "/retrieve/structured-data",
        query,
        ...options,
      }),
    structuredDataById: (id: string, options?: RequestOptions) =>
      this.request<StructuredDataItemResponse>({
        path: `/retrieve/structured-data/${encodeURIComponent(id)}`,
        ...options,
      }),
    structuredDataTypes: (options?: RequestOptions) =>
      this.request<TypeListResponse>({
        path: "/retrieve/structured-data/types",
        ...options,
      }),
    hops: (
      query: Record<string, string | number | boolean | undefined>,
      options?: RequestOptions,
    ) =>
      this.request<unknown>({
        path: "/retrieve/hops",
        query,
        ...options,
      }),
    changelogs: (query?: ChangelogListQuery, options?: RequestOptions) =>
      this.request<ChangelogListResponse>({
        path: "/retrieve/changelogs",
        query,
        ...options,
      }),
    changelog: (id: string, options?: RequestOptions) =>
      this.request<ChangelogItemResponse>({
        path: `/retrieve/changelogs/${encodeURIComponent(id)}`,
        ...options,
      }),
    changelogTypes: (options?: RequestOptions) =>
      this.request<TypeListResponse>({
        path: "/retrieve/changelogs/types",
        ...options,
      }),
    vectorStores: (options?: RequestOptions) =>
      this.request<VectorStoreListResponse>({
        path: "/retrieve/vectors/stores",
        ...options,
      }),
    vectors: (store: string, query?: ListQuery, options?: RequestOptions) =>
      this.request<VectorListResponse>({
        path: `/retrieve/vectors/${encodeURIComponent(store)}`,
        query,
        ...options,
      }),
    exploreOverview: (query?: Record<string, string | number | undefined>, options?: RequestOptions) =>
      this.request<unknown>({
        path: "/retrieve/explore/v1/overview",
        query,
        ...options,
      }),
    exploreCommunity: (communityId: string, options?: RequestOptions) =>
      this.request<unknown>({
        path: `/retrieve/explore/v1/communities/${encodeURIComponent(communityId)}`,
        ...options,
      }),
    exploreNeighbors: (entityId: string, options?: RequestOptions) =>
      this.request<unknown>({
        path: `/retrieve/explore/v1/neighbors/${encodeURIComponent(entityId)}`,
        ...options,
      }),
  };

  readonly facts = {
    list: (query?: ListFactsQuery, options?: RequestOptions) =>
      this.listFacts(query, options),
    get: (factId: string, options?: RequestOptions) =>
      this.getFact(factId, options),
    verify: (factId: string, body?: VerifyFactRequest, options?: RequestOptions) =>
      this.verifyFact(factId, body, options),
    reject: (factId: string, body?: VerifyFactRequest, options?: RequestOptions) =>
      this.rejectFact(factId, body, options),
    reset: (factId: string, body?: VerifyFactRequest, options?: RequestOptions) =>
      this.resetFact(factId, body, options),
  };

  readonly conflicts = {
    list: (query?: ConflictListQuery, options?: RequestOptions) =>
      this.listConflicts(query, options),
    get: (id: string, options?: RequestOptions) => this.getConflict(id, options),
    report: (query?: ConflictReportQuery, options?: RequestOptions) =>
      this.conflictReport(query, options),
    scan: (body?: ConflictScanRequest, options?: RequestOptions) =>
      this.scanConflicts(body, options),
    resolve: (id: string, body?: ConflictResolveRequest, options?: RequestOptions) =>
      this.resolveConflict(id, body, options),
    dismiss: (id: string, body?: ConflictDismissRequest, options?: RequestOptions) =>
      this.dismissConflict(id, body, options),
  };

  readonly graph = {
    addEntity: (body: AddEntityRequest, options?: RequestOptions) =>
      this.addEntity(body, options),
    updateEntity: (body: UpdateEntityRequest, options?: RequestOptions) =>
      this.updateEntity(body, options),
    addRelationship: (body: AddRelationshipRequest, options?: RequestOptions) =>
      this.addRelationship(body, options),
    updateRelationship: (body: UpdateRelationshipRequest, options?: RequestOptions) =>
      this.updateRelationship(body, options),
  };

  readonly tasks = {
    list: (options?: RequestOptions) => this.listTasks(options),
    get: (taskId: string, options?: RequestOptions) => this.getTask(taskId, options),
    cancel: (taskId: string, body: CancelIngestionRequest, options?: RequestOptions) =>
      this.cancelTask(taskId, body, options),
    activity: (
      taskId: string,
      query?: { offset?: number; limit?: number },
      options?: RequestOptions,
    ) =>
      this.request<unknown>({
        path: `/tasks/${encodeURIComponent(taskId)}/activity`,
        query,
        ...options,
      }),
    purge: (taskId: string, body?: PurgeIngestionRequest, options?: RequestOptions) =>
      this.request<unknown>({
        method: "POST",
        path: `/tasks/${encodeURIComponent(taskId)}/purge`,
        body: body ?? {},
        ...options,
      }),
    wait: (taskId: string, options?: WaitForTaskOptions) =>
      this.waitForTask(taskId, options),
  };

  readonly brains = {
    list: (options?: RequestOptions) => this.listBrains(options),
    create: (body: CreateBrainRequest, options?: RequestOptions) =>
      this.createBrain(body, options),
    clear: (brainId: string, options?: RequestOptions) =>
      this.request<BrainLifecycleResponse>({
        method: "POST",
        path: `/system/brains/${encodeURIComponent(brainId)}/clear`,
        ...options,
        brainId: null,
      }),
    delete: (brainId: string, options?: RequestOptions) =>
      this.request<BrainLifecycleResponse>({
        method: "DELETE",
        path: `/system/brains/${encodeURIComponent(brainId)}`,
        ...options,
        brainId: null,
      }),
  };

  readonly meta = {
    loginInfo: (options?: RequestOptions) =>
      this.request<LoginInfoResponse>({
        path: "/meta/login-info",
        ...options,
        brainId: null,
      }),
    entityLabels: (options?: RequestOptions) =>
      this.request<string[]>({ path: "/meta/entity-labels", ...options }),
    entityProperties: (options?: RequestOptions) =>
      this.request<unknown>({ path: "/meta/entity-properties", ...options }),
    relationshipProperties: (options?: RequestOptions) =>
      this.request<unknown>({ path: "/meta/relationships-properties", ...options }),
    ingestGroup: (groupTracking: string, options?: RequestOptions) =>
      this.request<IngestGroupMeterResponse>({
        path: `/meta/ingest-groups/${encodeURIComponent(groupTracking)}`,
        ...options,
      }),
    ingestionCapabilities: (options?: RequestOptions) =>
      this.request<IngestionCapabilitiesResponse>({
        path: "/meta/ingestion-capabilities",
        ...options,
      }),
  };

  health(options?: RequestOptions): Promise<HealthResponse> {
    return this.request<HealthResponse>({
      path: "/health",
      ...options,
      brainId: null,
    });
  }

  query(input: GetContextRequest, options?: RequestOptions): Promise<GetContextResponse> {
    return this.getContext(input, options);
  }

  private ingestText(
    input: string | IngestTextRequest,
    options?: RequestOptions,
  ): Promise<IngestionAcceptedResponse> {
    const body: IngestTextRequest =
      typeof input === "string"
        ? { data: { data_type: "text", text_data: input } }
        : input.text && !input.data
          ? {
              ...input,
              data: { data_type: "text", text_data: input.text },
            }
          : input;
    return this.request<IngestionAcceptedResponse>({
      method: "POST",
      path: "/ingest/",
      body,
      ...options,
    });
  }

  private ingestJson(
    input: IngestJsonRequest,
    options?: RequestOptions,
  ): Promise<IngestionAcceptedResponse> {
    const body = {
      ...input,
      data: input.data ?? { data_type: "json" as const, json_data: input.json_data },
    };
    return this.request<IngestionAcceptedResponse>({
      method: "POST",
      path: "/ingest/",
      body,
      ...options,
    });
  }

  private ingestUrl(
    input: string | IngestUrlRequest,
    options?: RequestOptions,
  ): Promise<IngestionAcceptedResponse> {
    const body: IngestUrlRequest = typeof input === "string" ? { url: input } : input;
    return this.request<IngestionAcceptedResponse>({
      method: "POST",
      path: "/ingest/url",
      body,
      ...options,
    });
  }

  private ingestFile(
    input: IngestFileRequest,
    options?: RequestOptions,
  ): Promise<IngestionAcceptedResponse> {
    const form = new FormData();
    const filename = input.filename ?? (input.file instanceof File ? input.file.name : "upload");
    form.append("file", input.file, filename);
    if (input.group_tracking) {
      form.append("group_tracking", input.group_tracking);
    }
    return this.request<IngestionAcceptedResponse>({
      method: "POST",
      path: "/ingest/file",
      form,
      ...options,
      brainId: input.brain_id ?? options?.brainId,
    });
  }

  private ingestStructured(
    input: IngestStructuredRequest,
    options?: RequestOptions,
  ): Promise<IngestionAcceptedResponse> {
    return this.request<IngestionAcceptedResponse>({
      method: "POST",
      path: "/ingest/structured",
      body: input,
      ...options,
    });
  }

  private ingestStructuredBatch(
    input: IngestStructuredRequest,
    options?: RequestOptions,
  ): Promise<IngestionAcceptedResponse> {
    return this.request<IngestionAcceptedResponse>({
      method: "POST",
      path: "/ingest/structured/batch",
      body: input,
      ...options,
    });
  }

  private getContext(
    input: GetContextRequest,
    options?: RequestOptions,
  ): Promise<GetContextResponse> {
    return this.request<GetContextResponse>({
      method: "POST",
      path: "/retrieve/context",
      body: input,
      ...options,
    });
  }

  private search(input: SearchRequest, options?: RequestOptions): Promise<SearchResponse> {
    return this.request<SearchResponse>({
      method: "POST",
      path: "/retrieve/search",
      body: input,
      ...options,
    });
  }

  private searchGet(input: SearchRequest, options?: RequestOptions): Promise<SearchResponse> {
    return this.request<SearchResponse>({
      path: "/retrieve/search",
      query: {
        query: input.query,
        k: input.k,
        as_of: input.as_of ?? undefined,
        include_validity_unknown: input.include_validity_unknown,
        channels: Array.isArray(input.channels) ? input.channels : input.channels,
        node_labels: Array.isArray(input.node_labels) ? input.node_labels : input.node_labels,
        community_labels: Array.isArray(input.community_labels)
          ? input.community_labels
          : input.community_labels,
        expand: input.expand,
        fusion: input.fusion ?? undefined,
        rerank: input.rerank ?? undefined,
        target: input.target ?? undefined,
        profile_stages: input.profile_stages,
      },
      ...options,
    });
  }

  private retrieveQuery(
    input: RetrieveRequest,
    options?: RequestOptions,
  ): Promise<RetrieveRequestResponse> {
    return this.request<RetrieveRequestResponse>({
      path: "/retrieve/",
      query: {
        text: input.text,
        limit: input.limit,
        preferred_entities: input.preferred_entities,
        include_rejected: input.include_rejected,
        as_of: input.as_of ?? undefined,
        include_validity_unknown: input.include_validity_unknown,
      },
      ...options,
    });
  }

  private getEntityStatus(
    input: string | EntityStatusRequest,
    options?: RequestOptions,
  ): Promise<GetEntityStatusResponse> {
    const query = typeof input === "string" ? { target: input } : input;
    return this.request<GetEntityStatusResponse>({
      path: "/retrieve/entity/status",
      query,
      ...options,
    });
  }

  private recommend(
    input: RecommendRequest,
    options?: RequestOptions,
  ): Promise<RecommendResponse> {
    return this.request<RecommendResponse>({
      method: "POST",
      path: "/retrieve/recommend",
      body: input,
      ...options,
    });
  }

  private getNeighbors(input: NeighborsRequest, options?: RequestOptions): Promise<unknown> {
    if (input.identification_params) {
      return this.request({
        method: "POST",
        path: "/retrieve/entities/neighbors",
        body: {
          identification_params: input.identification_params,
          looking_for: input.looking_for,
          limit: input.limit,
        },
        ...options,
      });
    }
    return this.request({
      path: "/retrieve/entities/neighbors",
      query: {
        entity_id: input.entity_id,
        looking_for: input.looking_for,
        limit: input.limit,
        include_rejected: input.include_rejected,
      },
      ...options,
    });
  }

  private listFacts(
    query?: ListFactsQuery,
    options?: RequestOptions,
  ): Promise<FactVerificationListResponse> {
    return this.request<FactVerificationListResponse>({
      path: "/model/facts",
      query,
      ...options,
    });
  }

  private getFact(factId: string, options?: RequestOptions): Promise<FactVerificationRecord> {
    return this.request<FactVerificationRecord>({
      path: `/model/facts/${encodeURIComponent(factId)}`,
      ...options,
    });
  }

  private verifyFact(
    factId: string,
    body?: VerifyFactRequest,
    options?: RequestOptions,
  ): Promise<FactVerificationRecord> {
    return this.request<FactVerificationRecord>({
      method: "POST",
      path: `/model/facts/${encodeURIComponent(factId)}/verify`,
      body: body ?? {},
      ...options,
    });
  }

  private rejectFact(
    factId: string,
    body?: VerifyFactRequest,
    options?: RequestOptions,
  ): Promise<FactVerificationRecord> {
    return this.request<FactVerificationRecord>({
      method: "POST",
      path: `/model/facts/${encodeURIComponent(factId)}/reject`,
      body: body ?? {},
      ...options,
    });
  }

  private resetFact(
    factId: string,
    body?: VerifyFactRequest,
    options?: RequestOptions,
  ): Promise<FactVerificationRecord> {
    return this.request<FactVerificationRecord>({
      method: "POST",
      path: `/model/facts/${encodeURIComponent(factId)}/reset`,
      body: body ?? {},
      ...options,
    });
  }

  private listConflicts(
    query?: ConflictListQuery,
    options?: RequestOptions,
  ): Promise<ConflictListResponse> {
    return this.request<ConflictListResponse>({
      path: "/retrieve/conflicts",
      query,
      ...options,
    });
  }

  private getConflict(id: string, options?: RequestOptions): Promise<ConflictItemResponse> {
    return this.request<ConflictItemResponse>({
      path: `/retrieve/conflicts/${encodeURIComponent(id)}`,
      ...options,
    });
  }

  private conflictReport(
    query?: ConflictReportQuery,
    options?: RequestOptions,
  ): Promise<ConflictReportResponse> {
    return this.request<ConflictReportResponse>({
      path: "/retrieve/conflicts/report",
      query,
      ...options,
    });
  }

  private scanConflicts(
    body?: ConflictScanRequest,
    options?: RequestOptions,
  ): Promise<ConflictScanAcceptedResponse> {
    return this.request<ConflictScanAcceptedResponse>({
      method: "POST",
      path: "/retrieve/conflicts/scan",
      body: body ?? {},
      ...options,
    });
  }

  private resolveConflict(
    id: string,
    body?: ConflictResolveRequest,
    options?: RequestOptions,
  ): Promise<ConflictItemResponse> {
    return this.request<ConflictItemResponse>({
      method: "POST",
      path: `/retrieve/conflicts/${encodeURIComponent(id)}/resolve`,
      body: body ?? {},
      ...options,
    });
  }

  private dismissConflict(
    id: string,
    body?: ConflictDismissRequest,
    options?: RequestOptions,
  ): Promise<ConflictItemResponse> {
    return this.request<ConflictItemResponse>({
      method: "POST",
      path: `/retrieve/conflicts/${encodeURIComponent(id)}/dismiss`,
      body: body ?? {},
      ...options,
    });
  }

  private addEntity(body: AddEntityRequest, options?: RequestOptions): Promise<unknown> {
    return this.request({
      method: "POST",
      path: "/model/entity",
      body,
      ...options,
    });
  }

  private updateEntity(body: UpdateEntityRequest, options?: RequestOptions): Promise<unknown> {
    return this.request({
      method: "PUT",
      path: "/model/entity",
      body,
      ...options,
    });
  }

  private addRelationship(
    body: AddRelationshipRequest,
    options?: RequestOptions,
  ): Promise<unknown> {
    return this.request({
      method: "POST",
      path: "/model/relationship",
      body,
      ...options,
    });
  }

  private updateRelationship(
    body: UpdateRelationshipRequest,
    options?: RequestOptions,
  ): Promise<unknown> {
    return this.request({
      method: "PUT",
      path: "/model/relationship",
      body,
      ...options,
    });
  }

  private listTasks(options?: RequestOptions): Promise<TaskListResponse> {
    return this.request<TaskListResponse>({
      path: "/tasks/",
      ...options,
    });
  }

  private getTask(taskId: string, options?: RequestOptions): Promise<TaskStateResponse> {
    return this.request<TaskStateResponse>({
      path: `/tasks/${encodeURIComponent(taskId)}`,
      ...options,
    });
  }

  private cancelTask(
    taskId: string,
    body: CancelIngestionRequest,
    options?: RequestOptions,
  ): Promise<CancelIngestionResponse> {
    return this.request<CancelIngestionResponse>({
      method: "POST",
      path: `/tasks/${encodeURIComponent(taskId)}/cancel`,
      body,
      ...options,
    });
  }

  async waitForTask(
    taskId: string,
    options: WaitForTaskOptions = {},
  ): Promise<TaskStateResponse> {
    const { intervalMs = 1000, timeoutMs = 120_000, poll, ...requestOptions } = options;
    const started = Date.now();

    while (true) {
      const task = await this.getTask(taskId, requestOptions);
      if (poll) {
        poll(task);
      }
      if (TERMINAL_TASK_STATUSES.has((task.status ?? "").toLowerCase())) {
        return task;
      }
      if (Date.now() - started >= timeoutMs) {
        throw new BrainAPIError(`Timed out waiting for task ${taskId}`, {
          status: 0,
          code: "TASK_TIMEOUT",
          detail: task,
        });
      }
      await sleep(intervalMs, requestOptions.signal);
    }
  }

  private listBrains(options?: RequestOptions): Promise<Brain[]> {
    return this.request<Brain[] | { brains: Brain[] }>({
      path: "/system/brains-list",
      ...options,
      brainId: null,
    }).then((data) => (Array.isArray(data) ? data : data.brains ?? []));
  }

  private createBrain(
    body: CreateBrainRequest,
    options?: RequestOptions,
  ): Promise<Brain | unknown> {
    return this.request({
      method: "POST",
      path: "/system/brains",
      body,
      ...options,
      brainId: null,
    });
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error("aborted"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason ?? new Error("aborted"));
      },
      { once: true },
    );
  });
}

export { BrainAPI as LumenBrain };

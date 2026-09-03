import {
  A2API_VERSION,
  extractRequestTables,
  resolveRequestTag,
  shouldOmitOpenGetTag,
  validateRequestStructure,
  variantRequestTagCandidates,
  type BindRequestPayload,
  type ApiJsonMethod,
  validateProposeRequest,
} from "@a2api/protocol";
import {
  ApiJsonClient,
  BoundExecutor,
  HitlController,
  isPermissionGateIssue,
  partitionPermissionIssues,
  type PendingRequest,
} from "@a2api/runtime";
import { overlayPlanWithDocument, type CatalogHit } from "./api-reuse.js";
import { bootstrapFromMessage, repairBody, type SchemaHint } from "./llm.js";
import type { LlmConfig } from "./llm-config.js";
import {
  chatModeForPlan,
  classifyChatMode,
  explainCurrentPage,
  hasCurrentPage,
  messageLooksLikePageRequest,
  modifyPageBind,
  planFromLayoutMessage,
  planFromLayoutNav,
  planFromModifiedBind,
  type ChatMode,
  type ModifyPageResult,
  type PageChatContext,
  type PageUiPatch,
} from "./chat-mode.js";
import { FileApprovalLedger } from "./approval-store.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  planFromIntent,
  toBindEnvelope,
  toProposeEnvelope,
  type BootstrapPlan,
} from "./intent.js";
import {
  commentsForPayload,
  mergeComments,
  type SchemaComments,
} from "./schema-comments.js";
import {
  catalogToComments,
  columnsFromComments,
  formatSchemaDigest,
  loadLiveColumns,
  loadLiveTableCatalog,
  localSchemaTables,
  mergeLiveTables,
} from "./schema-catalog.js";
import {
  applyFieldAlias,
  candidatesToPayload,
  extractFieldMentions,
  extractQueryTokens,
  looksLikeCancel,
  parseSchemaPick,
  pickKeywordField,
  resolveFieldName,
  resolveTableName,
  type SchemaChoicePayload,
} from "./schema-resolve.js";
import { loadSkills } from "./skills.js";
import {
  generateActionBind,
  type ActionBindContext,
  type ActionSlot,
} from "./action-bind.js";
import {
  applyTableQuery,
  type ColumnFilter,
  type ColumnSort,
} from "./table-query.js";
import { applyOwnerUserId, stripTemplateIdentity } from "./owner-body.js";
import { submitConfigApplication } from "./submit-config-application.js";
import { logApiCall } from "./call-logger.js";
import {
  getApijsonSessionByLogin,
  loginApijsonSession,
  touchApijsonCookie,
  upsertApijsonSession,
} from "./apijson-session-store.js";

export type ApijsonAuth = {
  login: string;
  password: string;
  userId?: string | number;
};

export interface SessionState {
  id: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  plan?: BootstrapPlan;
  pending?: PendingRequest;
  bind?: BindRequestPayload;
  lastResult?: unknown;
  a2uiMessages: unknown[];
  /** APIJSON HttpSession cookie (JSESSIONID) after server-side login */
  apijsonCookie?: string;
  apijsonAuth?: ApijsonAuth;
  /** Logged-in APIJSON visitor id (for OWNER writes) */
  visitorUserId?: string | number;
  dataModel: {
    ui: {
      page: number;
      count: number;
      order: string;
      keyword: string;
    };
    rows: unknown;
    write?: Record<string, unknown>;
    schemaComments?: SchemaComments;
  };
  pendingSchemaChoice?: SchemaChoicePayload & {
    originalMessage: string;
    pageContext?: PageChatContext;
  };
}

function adminBaseUrl(): string {
  return (
    process.env.ADMIN_BASE_URL?.replace(/\/+$/, "") ||
    `http://127.0.0.1:${process.env.ADMIN_PORT || 3001}`
  );
}

function pickVisitorId(loginBody: unknown): string | number | null {
  if (!loginBody || typeof loginBody !== "object") return null;
  const data = loginBody as Record<string, unknown>;
  const user = (data.User || data.user) as
    | { id?: string | number }
    | undefined;
  if (user?.id != null && user.id !== "") return user.id;
  const top = data.userId ?? data.userid ?? data.id ?? data.visitorId;
  if (top != null && top !== "") return top as string | number;
  return null;
}

function buildA2uiMessages(plan: BootstrapPlan): unknown[] {
  const surfaceId = plan.a2uiHint.surfaceId;
  return [
    {
      version: "v0.9",
      createSurface: {
        surfaceId,
        catalogId: "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json",
      },
    },
    {
      version: "v0.9",
      updateComponents: {
        surfaceId,
        components: [
          { id: "root", component: "Column", children: ["title", "filters", "results"] },
          {
            id: "title",
            component: "Text",
            text: plan.title,
            variant: "h2",
          },
          {
            id: "filters",
            component: "Text",
            text: "Filters bound to APIJSON via A2API bindRequest (no LLM on change)",
            variant: "caption",
          },
          {
            id: "results",
            component: "Text",
            text: { path: "/rowsSummary" },
          },
        ],
      },
    },
  ];
}

export class Orchestrator {
  private logExecute(opts: {
    session?: SessionState;
    source: string;
    operation: string;
    url?: string;
    body: Record<string, unknown>;
    result: { ok: boolean; status: number; body: unknown; error?: string };
    requestId?: string;
    usedLlm?: boolean;
    detail?: string;
    startedAt: number;
  }): void {
    const code =
      opts.result.body &&
      typeof opts.result.body === "object" &&
      !Array.isArray(opts.result.body) &&
      "code" in opts.result.body
        ? Number((opts.result.body as { code: unknown }).code)
        : opts.result.status;
    const tag =
      typeof opts.body.tag === "string" ? opts.body.tag : undefined;
    logApiCall(this.client, {
      userId: opts.session?.visitorUserId,
      submitter: opts.session?.apijsonAuth?.login,
      sessionId: opts.session?.id,
      requestId: opts.requestId,
      source: opts.source,
      operation: opts.operation,
      method: "POST",
      type: "JSON",
      url: opts.url || this.client.urlFor(opts.operation as never),
      tag,
      request: opts.body,
      response: opts.result.body,
      ok: opts.result.ok,
      code: Number.isFinite(code) ? code : opts.result.status,
      durationMs: Math.max(0, Date.now() - opts.startedAt),
      usedLlm: Boolean(opts.usedLlm),
      error: opts.result.error,
      detail: opts.detail,
    });
  }

  private logPendingCall(
    session: SessionState,
    pending: PendingRequest,
    source: string,
    usedLlm: boolean,
    startedAt: number,
  ): void {
    if (!pending.result) return;
    this.logExecute({
      session,
      source,
      operation: pending.method,
      url: pending.url,
      body: pending.body,
      result: pending.result,
      requestId: pending.requestId,
      usedLlm,
      detail: pending.status,
      startedAt,
    });
  }

  readonly client: ApiJsonClient;
  readonly hitl: HitlController;
  readonly bound: BoundExecutor;
  readonly approvals: FileApprovalLedger;
  private readonly sessions = new Map<string, SessionState>();
  /** requestId → sessionId for approval audit */
  private readonly requestSessions = new Map<string, string>();
  private catalogCache: { at: number; items: CatalogHit[] } | null = null;

  constructor(baseUrl = process.env.APIJSON_BASE_URL ?? "http://localhost:8080") {
    this.client = new ApiJsonClient({ baseUrl });
    const dataDir = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "data",
    );
    this.approvals = new FileApprovalLedger(
      path.join(dataDir, "approvals.jsonl"),
    );
    this.hitl = new HitlController({
      client: this.client,
      policy: "auto_nonsensitive",
      ledger: this.approvals,
      sessionIdFor: (requestId) => this.requestSessions.get(requestId),
    });
    this.bound = new BoundExecutor({ client: this.client });
  }

  getOrCreateSession(sessionId?: string): SessionState {
    const id = sessionId || `s_${Date.now().toString(36)}`;
    let s = this.sessions.get(id);
    if (!s) {
      s = {
        id,
        messages: [],
        a2uiMessages: [],
        dataModel: {
          ui: { page: 0, count: 20, order: "date-", keyword: "" },
          rows: null,
        },
      };
      this.sessions.set(id, s);
    }
    return s;
  }

  getSession(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  /** Access + information_schema table comments for layout inference. */
  async liveSchemaComments(): Promise<SchemaComments> {
    const tables = await loadLiveTableCatalog(this.client);
    return catalogToComments(mergeLiveTables(localSchemaTables(), tables));
  }

  private bindClientCookie(session: SessionState): void {
    this.client.cookie = session.apijsonCookie || "";
  }

  private saveClientCookie(session: SessionState): void {
    if (!this.client.cookie) return;
    session.apijsonCookie = this.client.cookie;
    const auth = session.apijsonAuth;
    if (!auth?.login) return;
    touchApijsonCookie(auth.login, this.client.cookie);
    if (!getApijsonSessionByLogin(auth.login)) {
      upsertApijsonSession({
        login: auth.login,
        password: auth.password,
        cookie: this.client.cookie,
        userId: auth.userId,
      });
    }
  }

  /**
   * OWNER-scoped APIJSON calls need a logged-in HttpSession.
   * Jar is shared with the /apijson BFF so chat + UI use the same JSESSIONID.
   */
  async ensureApijsonLogin(
    session: SessionState,
    auth?: ApijsonAuth | null,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (auth?.login && auth.password) {
      const same =
        session.apijsonAuth?.login === auth.login &&
        session.apijsonAuth?.password === auth.password;
      if (!same) {
        session.apijsonAuth = {
          login: auth.login,
          password: auth.password,
          userId: auth.userId,
        };
        session.apijsonCookie = undefined;
      } else if (auth.userId != null && session.apijsonAuth) {
        session.apijsonAuth.userId = auth.userId;
        session.visitorUserId = auth.userId;
      }
    }
    if (auth?.userId != null) session.visitorUserId = auth.userId;

    const creds = session.apijsonAuth;
    if (!creds?.login || !creds.password) {
      return {
        ok: false,
        error:
          "Please Login (top-right) first. OWNER role requires an APIJSON session.",
      };
    }

    const shared = getApijsonSessionByLogin(creds.login);
    if (
      shared?.cookie &&
      shared.password === creds.password &&
      (session.apijsonCookie === shared.cookie || !session.apijsonCookie)
    ) {
      session.apijsonCookie = shared.cookie;
      this.bindClientCookie(session);
      await this.ensureMetaCaches();
      return { ok: true };
    }

    if (session.apijsonCookie) {
      this.bindClientCookie(session);
      upsertApijsonSession({
        login: creds.login,
        password: creds.password,
        cookie: session.apijsonCookie,
        userId: creds.userId,
      });
      await this.ensureMetaCaches();
      return { ok: true };
    }

    const result = await loginApijsonSession(
      this.client.baseUrl,
      creds.login,
      creds.password,
      shared?.id,
    );
    if (!result.ok) {
      return {
        ok: false,
        error: result.error || "APIJSON login failed",
      };
    }
    const fromLogin = pickVisitorId(result.body);
    if (fromLogin != null) session.visitorUserId = fromLogin;
    else if (creds.userId != null) session.visitorUserId = creds.userId;
    session.apijsonCookie = result.session.cookie;
    this.client.cookie = result.session.cookie;
    touchApijsonCookie(creds.login, result.session.cookie);
    await this.ensureMetaCaches();
    return { ok: true };
  }

  /** Document → Request/Access/Function catalog from admin. */
  private async fetchApiCatalog(): Promise<CatalogHit[]> {
    if (this.catalogCache && Date.now() - this.catalogCache.at < 60_000) {
      return this.catalogCache.items;
    }
    try {
      const res = await fetch(`${adminBaseUrl()}/api/available-requests`, {
        signal: AbortSignal.timeout(4000),
      });
      const data = (await res.json().catch(() => null)) as {
        items?: CatalogHit[];
      } | null;
      const items = res.ok && Array.isArray(data?.items) ? data.items : [];
      this.catalogCache = { at: Date.now(), items };
      return items;
    } catch {
      return this.catalogCache?.items ?? [];
    }
  }

  /**
   * Writes: Document first, then Request/Access/Function, else Apply.
   */
  private async gateExistingApi(
    method: string,
    body: Record<string, unknown>,
  ): Promise<{ decision: string; reason?: string } | null> {
    const write =
      method === "post" ||
      method === "put" ||
      method === "delete" ||
      method === "crud";
    if (!write) return null;
    const tag =
      typeof body.tag === "string" && body.tag.trim()
        ? body.tag.trim()
        : extractRequestTables(body)[0] || "";
    if (!tag) return null;
    try {
      const qs = new URLSearchParams({ operation: method, tag });
      const gateRes = await fetch(`${adminBaseUrl()}/api/write-gate?${qs}`, {
        signal: AbortSignal.timeout(4000),
      });
      const gate = (await gateRes.json().catch(() => null)) as {
        decision?: string;
        reason?: string;
      } | null;
      if (gateRes.ok && gate?.decision) {
        return { decision: gate.decision, reason: gate.reason };
      }
    } catch {
      /* lookup failed — try the call */
    }
    return null;
  }

  /** Prefetch Access + Request tables for role / structure checks. */
  private async ensureMetaCaches(): Promise<void> {
    try {
      await Promise.all([
        this.client.accessRoles.ensureLoaded(this.client),
        this.client.requestStructures.ensureLoaded(this.client),
      ]);
    } catch {
      /* best-effort — validation degrades until cache loads */
    }
  }

  /** Strip userId (and POST id); never re-inject userId — session OWNER fills it. */
  private ownerBody(
    session: SessionState,
    body: Record<string, unknown>,
    method?: string,
  ): Record<string, unknown> {
    const stripped = stripTemplateIdentity(body, {
      stripIds: method === "post",
    });
    // Always omit userId on every method's table objects for write safety
    const next = applyOwnerUserId(stripped, session.visitorUserId);
    // Single-record User detail with empty id → current visitor
    if (
      method === "get" &&
      session.visitorUserId != null &&
      session.visitorUserId !== "" &&
      !("[]" in next)
    ) {
      const user = next.User;
      if (
        user != null &&
        typeof user === "object" &&
        !Array.isArray(user) &&
        (user as Record<string, unknown>).id == null
      ) {
        const id = session.visitorUserId;
        (user as Record<string, unknown>).id =
          typeof id === "number"
            ? id
            : /^-?\d+$/.test(String(id).trim())
              ? Number(id)
              : id;
      }
    }
    return next;
  }

  /**
   * Outermost tag = table name unless that Request is taken and unfit.
   */
  private async applyRequestTag(
    body: Record<string, unknown>,
    method: string,
    pageContext?: PageChatContext | null,
  ): Promise<Record<string, unknown>> {
    const tables = extractRequestTables(body);
    const table = tables.find((t) => t !== "Verify") || tables[0] || "";
    if (!table) return body;
    const tag = typeof body.tag === "string" ? body.tag.trim() : "";
    if (shouldOmitOpenGetTag(method, tag, table)) {
      const next = { ...body };
      delete next.tag;
      return next;
    }
    const m = method.toLowerCase();
    if (m === "get" || m === "head") return body;

    await this.client.requestStructures.ensureLoaded(this.client);
    const row = this.client.requestStructures.lookup(m, table);
    let unfit = false;
    if (row) {
      const extra = Object.keys(body).filter(
        (k) => /^[A-Z]/.test(k) && k !== table,
      );
      const nested = Object.keys(row.structure).filter((k) =>
        /^[A-Z]/.test(k),
      );
      if (extra.some((t) => !nested.includes(t))) unfit = true;
      else if (
        m === "post" ||
        m === "put" ||
        m === "delete" ||
        m === "gets" ||
        m === "heads"
      ) {
        unfit = !validateRequestStructure(
          m as ApiJsonMethod,
          { ...body, tag: table },
          row,
        ).ok;
      }
    }
    return {
      ...body,
      tag: resolveRequestTag({
        table,
        currentTag: tag,
        tableTagOccupied: row != null,
        tableTagUnfit: unfit,
        variants: variantRequestTagCandidates(table, {
          title: pageContext?.title || undefined,
          pageId: pageContext?.pageId || undefined,
        }),
        variantOccupied: (t) =>
          this.client.requestStructures.lookup(m, t) != null,
      }),
    };
  }

  /**
   * Bind a UI action slot (like / comment / …) via A2API bindRequest.
   * Does not replace the session list bind or execute the write.
   */
  async bindAction(
    sessionId: string | undefined,
    message: string,
    slot: ActionSlot,
    context: ActionBindContext | undefined,
    llm?: LlmConfig | null,
    auth?: ApijsonAuth | null,
  ) {
    const session = this.getOrCreateSession(sessionId);
    session.messages.push({ role: "user", content: message });
    const login = await this.ensureApijsonLogin(session, auth);
    if (!login.ok) {
      session.messages.push({ role: "assistant", content: login.error });
      return {
        sessionId: session.id,
        assistantMessage: login.error,
        actionSlot: slot,
        chatMode: "action" as ChatMode,
        pending: { status: "failed", issues: [login.error] },
        plan: { filters: [], surfaceId: "action" },
        dataModel: session.dataModel,
      };
    }
    this.bindClientCookie(session);
    try {
      const liveTables = await loadLiveTableCatalog(this.client).catch(
        () => [] as Awaited<ReturnType<typeof loadLiveTableCatalog>>,
      );
      const liveComments = catalogToComments(liveTables);
      const extra: SchemaComments = {
        tables: {
          ...(session.dataModel.schemaComments?.tables || {}),
          ...(context?.comments?.tables || {}),
        },
        columns: {
          ...(session.dataModel.schemaComments?.columns || {}),
          ...(context?.comments?.columns || {}),
        },
        types: session.dataModel.schemaComments?.types || {},
      };
      const comments = mergeComments(liveComments, extra);
      const generated = await generateActionBind(
        slot,
        {
          table: context?.table ?? null,
          columns: context?.columns ?? [],
          comments,
          app: context?.app,
          page: context?.page,
        },
        llm,
      );
      if (!generated) {
        const assistantMessage = `Could not bind "${slot}" from the current project's schema. Add table/column comments or try again after loading a list.`;
        session.messages.push({ role: "assistant", content: assistantMessage });
        return {
          sessionId: session.id,
          assistantMessage,
          actionSlot: slot,
          chatMode: "action" as ChatMode,
          pending: { status: "failed", issues: [assistantMessage] },
          plan: {
            filters: session.plan?.a2uiHint.filters ?? [],
            surfaceId: session.plan?.a2uiHint.surfaceId ?? "action",
            viewMode: session.plan?.viewMode,
            title: session.plan?.title,
          },
          dataModel: session.dataModel,
        };
      }
      const { bind, source } = generated;
      this.bound.register(bind);
      const envelopes = [toBindEnvelope(bind)];
      const assistantMessage =
        source === "llm"
          ? `Bound "${slot}" via A2API bindRequest (${bind.method}). Page list bind unchanged.`
          : `Bound "${slot}" via A2API bindRequest from this project's schema (${bind.method}). Page list bind unchanged.`;
      session.messages.push({ role: "assistant", content: assistantMessage });
      return {
        sessionId: session.id,
        assistantMessage,
        actionSlot: slot,
        chatMode: "action" as ChatMode,
        actionBind: bind,
        a2apiEnvelopes: envelopes,
        pending: {
          status: "done",
          requestId: bind.bindingId,
          method: bind.method,
          body: bind.bodyTemplate,
        },
        plan: {
          filters: session.plan?.a2uiHint.filters ?? [],
          surfaceId: session.plan?.a2uiHint.surfaceId ?? "action",
          viewMode: session.plan?.viewMode,
          title: session.plan?.title,
        },
        dataModel: session.dataModel,
      };
    } finally {
      this.saveClientCookie(session);
    }
  }

  async chat(
    sessionId: string | undefined,
    message: string,
    llm?: LlmConfig | null,
    auth?: ApijsonAuth | null,
    action?: { slot: ActionSlot; context?: ActionBindContext },
    pageContext?: PageChatContext,
    schemaPick?: string | null,
  ) {
    if (action?.slot) {
      return this.bindAction(
        sessionId,
        message,
        action.slot,
        action.context,
        llm,
        auth,
      );
    }
    const session = this.getOrCreateSession(sessionId);
    session.messages.push({ role: "user", content: message });

    const login = await this.ensureApijsonLogin(session, auth);
    if (!login.ok) {
      session.messages.push({ role: "assistant", content: login.error });
      return {
        sessionId: session.id,
        chatMode: "explain" as ChatMode,
        assistantMessage: login.error,
        pending: { status: "failed", issues: [login.error] },
        dataModel: session.dataModel,
      };
    }
    this.bindClientCookie(session);
    try {
      return await this.chatWithSession(
        session,
        message,
        llm,
        pageContext,
        schemaPick,
      );
    } finally {
      this.saveClientCookie(session);
    }
  }

  private async explainReply(
    session: SessionState,
    message: string,
    pageContext: PageChatContext | undefined,
    llm?: LlmConfig | null,
  ) {
    const assistantMessage = await explainCurrentPage(
      message,
      pageContext,
      llm,
      session.messages,
    );
    session.messages.push({ role: "assistant", content: assistantMessage });
    return {
      sessionId: session.id,
      chatMode: "explain" as ChatMode,
      assistantMessage,
      pending: { status: "done", method: "get", body: {} },
      plan: {
        filters: [],
        surfaceId: pageContext?.pageId || "explain",
        viewMode: pageContext?.pageKind === "list" ? "list" : pageContext?.pageKind ? "detail" : undefined,
        title: pageContext?.title,
      },
      dataModel: session.dataModel,
    };
  }

  private modifyUiReply(
    session: SessionState,
    pageContext: PageChatContext | undefined,
    modified: ModifyPageResult,
  ) {
    session.messages.push({ role: "assistant", content: modified.message });
    const bind = pageContext?.bind?.url ? pageContext.bind : undefined;
    return {
      sessionId: session.id,
      source: modified.source,
      chatMode: "modify" as ChatMode,
      assistantMessage: modified.message,
      pagePatch: {
        ...(modified.ui || {}),
        ...(modified.title ? { title: modified.title } : {}),
      } as PageUiPatch,
      pending: {
        status: "done",
        method: "get",
        body: pageContext?.bind?.bodyTemplate ?? {},
      },
      ...(bind ? { bind } : {}),
      lastResult: session.lastResult,
      plan: {
        filters: session.plan?.a2uiHint.filters ?? [],
        surfaceId: pageContext?.pageId || session.plan?.a2uiHint.surfaceId || "page",
        viewMode:
          pageContext?.pageKind === "list"
            ? "list"
            : pageContext?.pageKind
              ? "detail"
              : session.plan?.viewMode,
        title: modified.title || pageContext?.title,
      },
      dataModel: session.dataModel,
    };
  }

  private planPrimaryTable(plan: BootstrapPlan): string {
    const tables = extractRequestTables(plan.propose.body);
    return tables.find((t) => t !== "Verify") || tables[0] || "";
  }

  private schemaChoiceReply(
    session: SessionState,
    pending: SchemaChoicePayload & {
      originalMessage: string;
      pageContext?: PageChatContext;
    },
  ) {
    session.pendingSchemaChoice = pending;
    const names = pending.candidates
      .map((c) => (c.comment ? `${c.name} (${c.comment})` : c.name))
      .join(", ");
    const kind = pending.kind === "field" ? "field" : "table";
    const assistantMessage =
      pending.reason === "ambiguous"
        ? `Local schema is not unique for “${pending.query}”. APIJSON candidates: ${names || "—"}. Confirm one to continue.`
        : `No local ${kind} matched “${pending.query}”. APIJSON candidates: ${names || "type a name"}. Confirm one to continue.`;
    session.messages.push({ role: "assistant", content: assistantMessage });
    return {
      sessionId: session.id,
      chatMode: "explain" as ChatMode,
      assistantMessage,
      schemaChoice: {
        kind: pending.kind,
        reason: pending.reason,
        query: pending.query,
        table: pending.table,
        candidates: pending.candidates,
      },
      pending: { status: "awaiting_schema", method: "get", body: {} },
      plan: {
        filters: [],
        surfaceId: pending.pageContext?.pageId || "schema_choice",
        title: pending.pageContext?.title,
      },
      dataModel: session.dataModel,
    };
  }

  private async resolveTableForChat(query: string): Promise<
    | { status: "matched"; hint: SchemaHint }
    | { status: "ask"; payload: SchemaChoicePayload }
    | { status: "none" }
  > {
    const tokens = extractQueryTokens(query);
    if (!tokens.length) return { status: "none" };
    const local = localSchemaTables();
    let decision = resolveTableName(query, local);
    if (decision.status === "matched") {
      return { status: "matched", hint: { table: decision.name } };
    }
    const live = await loadLiveTableCatalog(this.client).catch(() => []);
    const merged = mergeLiveTables(local, live);
    decision = resolveTableName(query, merged);
    if (decision.status === "matched") {
      return { status: "matched", hint: { table: decision.name } };
    }
    if (decision.status === "ask") {
      return {
        status: "ask",
        payload: candidatesToPayload(
          "table",
          decision.reason,
          tokens.join(" "),
          decision.ranked,
        ),
      };
    }
    if (live.length) {
      return {
        status: "ask",
        payload: candidatesToPayload("table", "local_miss", tokens.join(" "), []),
      };
    }
    return { status: "none" };
  }

  private async resolveFieldsForChat(
    session: SessionState,
    message: string,
    ctx: PageChatContext,
  ): Promise<
    | { status: "ok"; message: string }
    | {
        status: "ask";
        payload: SchemaChoicePayload;
      }
  > {
    const mentions = extractFieldMentions(message);
    const table = (ctx.table || "").trim();
    if (!mentions.length || !table) return { status: "ok", message };
    const extra = [
      ...(ctx.columns || []),
      ...(ctx.columnOrder || []),
      ...Object.keys(ctx.columnMetas || {}),
    ];
    let columns = columnsFromComments(
      table,
      session.dataModel.schemaComments,
      extra,
    );
    const needsLive = mentions.some(
      (m) => resolveFieldName(m, columns).status !== "matched",
    );
    if (needsLive) {
      const live = await loadLiveColumns(this.client, table).catch(() => null);
      if (live) {
        session.dataModel.schemaComments = mergeComments(
          session.dataModel.schemaComments || {
            tables: {},
            columns: {},
            types: {},
          },
          live.comments,
        );
        columns = columnsFromComments(table, live.comments, extra);
      }
    }
    let next = message;
    for (const mention of mentions) {
      const d = resolveFieldName(mention, columns);
      if (d.status === "matched") {
        next = applyFieldAlias(next, mention, d.name);
        continue;
      }
      if (d.status === "ask") {
        return {
          status: "ask",
          payload: candidatesToPayload(
            "field",
            d.reason,
            mention,
            d.ranked,
            table,
          ),
        };
      }
      if (columns.length) {
        return {
          status: "ask",
          payload: candidatesToPayload(
            "field",
            "local_miss",
            mention,
            columns.slice(0, 8).map((c) => ({
              name: c.name,
              comment: c.comment,
              source: c.source,
              score: 1,
            })),
            table,
          ),
        };
      }
    }
    return { status: "ok", message: next };
  }

  private async chatWithSession(
    session: SessionState,
    message: string,
    llm?: LlmConfig | null,
    pageContext?: PageChatContext,
    schemaPick?: string | null,
  ): Promise<Record<string, unknown>> {
    await loadSkills(this.client).catch(() => undefined);

    const waiting = session.pendingSchemaChoice;
    if (waiting) {
      if (looksLikeCancel(message)) {
        session.pendingSchemaChoice = undefined;
        return this.explainReply(
          session,
          "Cancelled. Name the table or field to use, or ask again.",
          pageContext,
          llm,
        );
      }
      let pick = parseSchemaPick(message, waiting.candidates, schemaPick);
      if (!pick && waiting.kind === "table") {
        const again = await this.resolveTableForChat(message);
        if (again.status === "matched" && again.hint.table) {
          pick = again.hint.table;
        } else if (again.status === "ask") {
          return this.schemaChoiceReply(session, {
            ...again.payload,
            originalMessage: waiting.originalMessage,
            pageContext: waiting.pageContext,
          });
        }
      }
      if (pick) {
        session.pendingSchemaChoice = undefined;
        if (waiting.kind === "table") {
          const ctx: PageChatContext = {
            ...(waiting.pageContext || pageContext || {}),
            table: pick,
          };
          return this.chatWithSession(
            session,
            waiting.originalMessage,
            llm,
            ctx,
          );
        }
        const rewritten = applyFieldAlias(
          waiting.originalMessage,
          waiting.query,
          pick,
        );
        return this.chatWithSession(
          session,
          rewritten,
          llm,
          waiting.pageContext || pageContext,
        );
      }
      if (
        messageLooksLikePageRequest(message) &&
        message.trim().length > 12
      ) {
        session.pendingSchemaChoice = undefined;
      } else {
        return this.schemaChoiceReply(session, waiting);
      }
    }

    const classified = classifyChatMode(message, pageContext);
    if (classified === "explain") {
      return this.explainReply(session, message, pageContext, llm);
    }

    let plan: BootstrapPlan;
    let source: "rules" | "llm";
    let chatMode: ChatMode = classified;
    let pendingPagePatch: PageUiPatch | undefined;

    if (classified === "modify") {
      if (!hasCurrentPage(pageContext)) {
        return this.explainReply(
          session,
          `${message}\n\n(No page is open to edit. Open or generate a page first, or switch to Generate.)`,
          pageContext,
          llm,
        );
      }
      if (pageContext) {
        const fields = await this.resolveFieldsForChat(
          session,
          message,
          pageContext,
        );
        if (fields.status === "ask") {
          return this.schemaChoiceReply(session, {
            ...fields.payload,
            originalMessage: message,
            pageContext,
          });
        }
        message = fields.message;
      }
      const modified = await modifyPageBind(message, pageContext, llm);
      if (!modified) {
        session.messages.push({
          role: "assistant",
          content:
            "Could not apply that edit on this page. Try: contacts list layout, card grid, hide a column, or sort by a field. Edit never opens a new page.",
        });
        return {
          sessionId: session.id,
          chatMode: "explain" as ChatMode,
          assistantMessage:
            "Could not apply that edit on this page. Try: contacts list layout, card grid, hide a column, or sort by a field. Edit never opens a new page.",
          pending: { status: "done", method: "get", body: {} },
          plan: {
            filters: [],
            surfaceId: pageContext?.pageId || "explain",
            viewMode:
              pageContext?.pageKind === "list"
                ? "list"
                : pageContext?.pageKind
                  ? "detail"
                  : undefined,
            title: pageContext?.title,
          },
          dataModel: session.dataModel,
        };
      }
      if (!modified.body) {
        if (!modified.ui && !modified.title) {
          session.messages.push({
            role: "assistant",
            content: modified.message,
          });
          return {
            sessionId: session.id,
            source: modified.source,
            chatMode: "explain" as ChatMode,
            assistantMessage: modified.message,
            pending: { status: "done", method: "get", body: {} },
            plan: {
              filters: [],
              surfaceId: pageContext?.pageId || "explain",
              viewMode:
                pageContext?.pageKind === "list"
                  ? "list"
                  : pageContext?.pageKind
                    ? "detail"
                    : undefined,
              title: pageContext?.title,
            },
            dataModel: session.dataModel,
          };
        }
        return this.modifyUiReply(session, pageContext, modified);
      }
      plan = planFromModifiedBind(modified.body, pageContext!, modified.title);
      source = modified.source;
      pendingPagePatch = {
        ...(modified.ui || {}),
        ...(modified.title ? { title: modified.title } : {}),
      };
    } else {
      const catalog = await this.fetchApiCatalog();
      const peeked =
        (pageContext?.generatePage ? planFromLayoutNav(pageContext) : null) ??
        planFromLayoutMessage(message) ??
        planFromIntent(message);
      let schemaHint: SchemaHint | undefined;
      const knownTable = (pageContext?.table || "").trim();
      const peekedTable = this.planPrimaryTable(peeked);
      const localKnown =
        Boolean(knownTable) ||
        (peeked.kind !== "unknown" && Boolean(peekedTable));
      if (
        !localKnown &&
        (messageLooksLikePageRequest(message) || pageContext?.generatePage)
      ) {
        const query = [message, pageContext?.targetApp, pageContext?.app]
          .filter(Boolean)
          .join(" ");
        const resolved = await this.resolveTableForChat(query);
        if (resolved.status === "ask") {
          return this.schemaChoiceReply(session, {
            ...resolved.payload,
            originalMessage: message,
            pageContext,
          });
        }
        if (resolved.status === "matched") {
          schemaHint = resolved.hint;
          pageContext = {
            ...(pageContext || {}),
            table: resolved.hint.table,
          };
        } else if (peeked.kind === "unknown") {
          return this.schemaChoiceReply(session, {
            kind: "table",
            reason: "local_miss",
            query: extractQueryTokens(query).join(" ") || message.trim(),
            candidates: [],
            originalMessage: message,
            pageContext,
          });
        }
      } else if (knownTable) {
        schemaHint = { table: knownTable };
      }
      if (schemaHint?.table) {
        const cols = await loadLiveColumns(this.client, schemaHint.table).catch(
          () => null,
        );
        if (cols) {
          schemaHint = {
            ...schemaHint,
            keywordField: pickKeywordField(
              schemaHint.table,
              cols.comments,
            ),
            digest: formatSchemaDigest(cols.comments, schemaHint.table),
          };
          session.dataModel.schemaComments = mergeComments(
            session.dataModel.schemaComments || {
              tables: {},
              columns: {},
              types: {},
            },
            cols.comments,
          );
        }
      }
      const boot = await bootstrapFromMessage(
        message,
        llm,
        pageContext,
        catalog,
        schemaHint,
      );
      plan = overlayPlanWithDocument(boot.plan, catalog);
      source = boot.source;
      chatMode = chatModeForPlan(plan);
      if (chatMode === "explain") {
        return this.explainReply(session, message, pageContext, llm);
      }
    }
    if (
      plan.propose.method === "post" ||
      plan.propose.method === "put" ||
      plan.propose.method === "get" ||
      plan.propose.method === "gets"
    ) {
      plan.propose.body = this.ownerBody(
        session,
        plan.propose.body,
        plan.propose.method,
      );
    }
    plan.propose.body = await this.applyRequestTag(
      plan.propose.body,
      plan.propose.method,
      pageContext,
    );
    session.plan = plan;
    session.a2uiMessages = buildA2uiMessages(plan);

    // Seed write form / list defaults into data model
    if (plan.bind) {
      const count = Number(
        (plan.bind.bodyTemplate["[]"] as { count?: number } | undefined)?.count ??
          3,
      );
      session.dataModel.ui.count = count;
      const order =
        (
          (plan.bind.bodyTemplate["[]"] as Record<string, unknown> | undefined)?.[
            Object.keys(
              (plan.bind.bodyTemplate["[]"] as Record<string, unknown>) || {},
            ).find((k) => k !== "count" && k !== "page") || ""
          ] as { "@order"?: string } | undefined
        )?.["@order"] || "date-";
      session.dataModel.ui.order = order;
    }
    if (plan.writeForm) {
      session.dataModel.write = structuredClone(plan.propose.body);
    }

    let pending = this.hitl.propose(plan.propose);
    this.requestSessions.set(plan.propose.requestId, session.id);
    const envelopes: unknown[] = [toProposeEnvelope(plan.propose)];
    /** Non-permission APIJSON errors: AI self-fix up to 2 times. */
    let repairAttempts = 0;
    const MAX_AI_REPAIRS = 2;

    const errorText = (p: PendingRequest) =>
      p.issues?.join("; ") ||
      p.result?.error ||
      "APIJSON request failed";

    const canAiRepair = (p: PendingRequest): boolean => {
      if (p.status !== "failed") return false;
      if (p.permissionGate) return false;
      const issues = p.issues?.length
        ? p.issues
        : p.result?.error
          ? [p.result.error]
          : [];
      if (!issues.length) return false;
      const { permission, other } = partitionPermissionIssues(issues);
      if (other.length) return true;
      // Pure permission → admin queue, not AI rewrite
      return permission.length === 0 && !issues.some(isPermissionGateIssue);
    };

    const tryAiRepair = async (p: PendingRequest): Promise<boolean> => {
      if (repairAttempts >= MAX_AI_REPAIRS || !canAiRepair(p)) return false;
      const repaired = await repairBody(
        p.method,
        p.body,
        errorText(p),
        llm,
      );
      if (!repaired) return false;
      repairAttempts += 1;
      const fixed = await this.applyRequestTag(
        this.ownerBody(session, repaired, p.method),
        p.method,
        pageContext,
      );
      pending = this.hitl.revise({
        requestId: p.requestId,
        body: fixed,
      });
      plan.propose.body = fixed;
      envelopes.push({
        version: A2API_VERSION,
        reviseRequest: {
          requestId: p.requestId,
          body: fixed,
          repairAttempt: repairAttempts,
        },
      });
      return true;
    };

    while (pending.status === "failed" && (await tryAiRepair(pending))) {
      /* revise until validated or repairs exhausted */
    }

    const skipExecuteForCreate =
      plan.openCreate === true &&
      plan.viewMode === "detail" &&
      !plan.bind;

    const isWrite =
      plan.propose.method === "post" ||
      plan.propose.method === "put" ||
      plan.propose.method === "delete";

    // Writes: Document → Request/Access/Function → Apply (no Data API jump).
    if (isWrite && pending.status === "validated" && !skipExecuteForCreate) {
      const gate = await this.gateExistingApi(
        plan.propose.method,
        plan.propose.body,
      );
      if (gate?.decision === "apply") {
        pending = await this.hitl.awaitPermissionConfig(
          plan.propose.requestId,
          [
            gate.reason ||
              "No existing Document/Request/Access/Function — submit Apply",
          ],
        );
      }
    }

    const advanceStarted = Date.now();
    // Create flows open an empty detail form — no list GET / Table bind.
    if (skipExecuteForCreate && pending.status === "validated") {
      pending.status = "done";
      pending.result = { ok: true, status: 200, body: {} };
    } else if (pending.status !== "failed") {
      pending = await this.hitl.advance(plan.propose.requestId);
    }
    session.pending = pending;
    this.logPendingCall(
      session,
      pending,
      "opendoubao",
      source !== "rules",
      advanceStarted,
    );

    const schemaComments = await commentsForPayload(
      this.client,
      plan.propose.body,
      pending.result?.body,
    );
    session.dataModel.schemaComments = schemaComments;

    const response: Record<string, unknown> = {
      sessionId: session.id,
      source,
      chatMode,
      title: plan.title,
      kind: plan.kind,
      a2uiMessages: session.a2uiMessages,
      a2apiEnvelopes: envelopes,
      pending,
      schemaComments,
      ...(pendingPagePatch && Object.keys(pendingPagePatch).length
        ? { pagePatch: pendingPagePatch }
        : {}),
      plan: {
        filters: plan.a2uiHint.filters,
        writeForm: plan.writeForm,
        openCreate: plan.openCreate === true,
        surfaceId: plan.a2uiHint.surfaceId,
        viewMode: plan.viewMode,
        title: plan.title,
      },
      dataModel: session.dataModel,
    };

    if (pending.status === "awaiting_approval") {
      const sensitive = pending.sensitive !== false;
      if (pending.permissionGate) {
        const submitted = await submitConfigApplication({
          client: this.client,
          pending,
          sessionId: session.id,
          apijsonBaseUrl: this.client.baseUrl,
        });
        if (submitted.ok) {
          response.configApplicationId = submitted.id;
        } else if (submitted.error && submitted.error !== "skip non-permission-gate") {
          response.configApplicationError = submitted.error;
        }
      }
      session.messages.push({
        role: "assistant",
        content: sensitive
          ? `Sensitive ${plan.propose.method.toUpperCase()} queued for admin approval (${pending.approvalId || pending.requestId}).`
          : `Write awaiting approval (${plan.propose.method.toUpperCase()}).`,
      });
      response.assistantMessage = pending.permissionGate
        ? `Needs Access/Request configuration — submitted to Admin (http://localhost:5174). Approve there to write Access/Request/Document/Chain, then retry. Source: ${source}`
        : sensitive
          ? `Sensitive operation queued for vendor admin approval. Source: ${source}`
          : `Write pending approval. Source: ${source}`;
      return response;
    }

    if (pending.status === "done" && pending.result?.ok) {
      session.lastResult = pending.result.body;
      session.dataModel.rows = pending.result.body;
      envelopes.push({
        version: A2API_VERSION,
        requestResult: {
          requestId: pending.requestId,
          ok: true,
          status: pending.result.status,
          body: pending.result.body,
        },
      });

      if (plan.bind) {
        // Only bind after successful HTTP
        const bind = {
          ...plan.bind,
          bodyTemplate: structuredClone(plan.propose.body),
        };
        this.bound.register(bind);
        session.bind = bind;
        envelopes.push(toBindEnvelope(bind));
        const connected =
          chatMode === "modify"
            ? `Updated "${plan.title}". Filter/sort/pagination still call APIJSON directly (source: ${source}).`
            : plan.openCreate
              ? `Connected ${plan.title}. Opening the create form — fill required fields (*) and submit.`
              : `Connected ${plan.title}. Filter/sort/pagination changes will call APIJSON directly without AI.`;
        session.messages.push({
          role: "assistant",
          content: connected,
        });
        response.assistantMessage =
          chatMode === "modify"
            ? connected
            : plan.openCreate
              ? `Connected "${plan.title}". Fill the create form (required fields marked *) and click Create.`
              : `Connected "${plan.title}" and bound UI. Condition changes call APIJSON directly (source: ${source}).`;
        response.bind = bind;
      } else if (plan.openCreate) {
        session.messages.push({
          role: "assistant",
          content: `Opening ${plan.title}. Fill required fields (*) and click Save to create.`,
        });
        response.assistantMessage = `Opening "${plan.title}". Fields start empty — fill required ones (*) and click Save to create.`;
      } else {
        const auto =
          pending.approvalId && !pending.sensitive
            ? ` Auto-approved (audit ${pending.approvalId}).`
            : pending.approvalId
              ? ` Approval record ${pending.approvalId}.`
              : "";
        session.messages.push({
          role: "assistant",
          content: `Write/single-record operation completed.${auto}`,
        });
        response.assistantMessage = `Operation succeeded (source: ${source}).${auto}`;
      }
      response.lastResult = pending.result.body;
      return response;
    }

    // Failed after execute — AI repair (remaining of 2 attempts), then Data API
    while (pending.status === "failed" && (await tryAiRepair(pending))) {
      if (pending.status === "failed") continue;
      pending = await this.hitl.advance(pending.requestId);
      session.pending = pending;
      response.pending = pending;
      if (pending.status === "done" && pending.result?.ok) {
        session.lastResult = pending.result.body;
        session.dataModel.rows = pending.result.body;
        response.lastResult = pending.result.body;
        if (plan.bind) {
          const bind = {
            ...plan.bind,
            bodyTemplate: structuredClone(pending.body),
          };
          this.bound.register(bind);
          session.bind = bind;
          response.bind = bind;
          response.assistantMessage = `Auto-repaired (attempt ${repairAttempts}) and connected "${plan.title}".`;
        } else {
          response.assistantMessage = `Auto-repaired (attempt ${repairAttempts}) and operation succeeded.`;
        }
        session.messages.push({
          role: "assistant",
          content: String(response.assistantMessage),
        });
        return response;
      }
      if (pending.status === "awaiting_approval") {
        if (pending.permissionGate) {
          const submitted = await submitConfigApplication({
            client: this.client,
            pending,
            sessionId: session.id,
            apijsonBaseUrl: this.client.baseUrl,
          });
          if (submitted.ok) response.configApplicationId = submitted.id;
        }
        response.assistantMessage = pending.permissionGate
          ? `Needs Access/Request configuration — submitted to Admin (http://localhost:5174).`
          : `Write pending approval after repair.`;
        session.messages.push({
          role: "assistant",
          content: String(response.assistantMessage),
        });
        return response;
      }
    }

    const err =
      pending.issues?.join("; ") ||
      pending.result?.error ||
      "unknown";
    const permFail =
      pending.permissionGate ||
      isPermissionGateIssue(err) ||
      partitionPermissionIssues(pending.issues || [err]).permission.length > 0;

    // Writes: never auto-jump Data API; permission → Apply instead.
    if (isWrite && permFail && !pending.permissionGate) {
      pending = await this.hitl.awaitPermissionConfig(
        pending.requestId,
        pending.issues?.length ? pending.issues : [err],
      );
      session.pending = pending;
      response.pending = pending;
      const submitted = await submitConfigApplication({
        pending,
        sessionId: session.id,
        apijsonBaseUrl: this.client.baseUrl,
      });
      if (submitted.ok) response.configApplicationId = submitted.id;
      response.guideToDataApi = false;
      response.assistantMessage =
        `Needs Access/Request configuration — submitted to Admin (http://localhost:5174). Approve there, then retry. (${err})`;
      session.messages.push({
        role: "assistant",
        content: String(response.assistantMessage),
      });
      return response;
    }

    response.guideToDataApi = !isWrite;
    response.assistantMessage = isWrite
      ? repairAttempts > 0
        ? `Tried AI repair ${repairAttempts} time(s) but still failing: ${err}. Fix the request and retry from Chat (not jumping to Data API).`
        : `Write failed: ${err}. Retry from Chat after fixing, or submit Apply if this is a permission issue.`
      : repairAttempts > 0
        ? `Tried AI repair ${repairAttempts} time(s) but still failing: ${err}. Open the Data API tab, edit the request JSON, then Retry.`
        : `Could not connect APIJSON: ${err}. Open the Data API tab, edit the request JSON, then Retry.`;
    session.messages.push({
      role: "assistant",
      content: String(response.assistantMessage),
    });
    return response;
  }

  async decide(
    sessionId: string,
    requestId: string,
    action: "approve" | "reject",
    revisedBody?: Record<string, unknown>,
    auth?: ApijsonAuth | null,
  ) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error("session not found");
    const login = await this.ensureApijsonLogin(session, auth);
    if (!login.ok) throw new Error(login.error);
    this.bindClientCookie(session);
    try {
      if (revisedBody) {
        this.hitl.revise({ requestId, body: revisedBody });
        // re-enter awaiting if write
        const p = this.hitl.getPending(requestId);
        if (p && p.status === "validated") {
          await this.hitl.advance(requestId);
        }
      }
      const startedAt = Date.now();
      const pending = await this.hitl.decide(requestId, action, "operator");
      session.pending = pending;
      this.logPendingCall(session, pending, "opendoubao", false, startedAt);
      if (pending.status === "done" && pending.result?.ok) {
        session.lastResult = pending.result.body;
        session.dataModel.rows = pending.result.body;
      }
      const schemaComments = await commentsForPayload(
        this.client,
        pending.body,
        pending.result?.body,
      );
      session.dataModel.schemaComments = schemaComments;
      return {
        pending,
        dataModel: session.dataModel,
        lastResult: session.lastResult,
        schemaComments,
      };
    } finally {
      this.saveClientCookie(session);
    }
  }

  /** Propose a write (e.g. detail form save) through HITL without going via chat NL. */
  async proposeWrite(
    sessionId: string | undefined,
    payload: {
      method: "put" | "post" | "delete";
      body: Record<string, unknown>;
      rationale?: string;
    },
    auth?: ApijsonAuth | null,
  ) {
    const session = this.getOrCreateSession(sessionId);
    const login = await this.ensureApijsonLogin(session, auth);
    if (!login.ok) {
      return {
        sessionId: session.id,
        pending: {
          requestId: "",
          method: payload.method,
          body: payload.body,
          status: "failed" as const,
          issues: [login.error],
          risk: "write" as const,
        },
        requestBody: payload.body,
      };
    }
    this.bindClientCookie(session);
    try {
      await this.ensureMetaCaches();
      const requestId = `w_${Date.now().toString(36)}`;
      this.requestSessions.set(requestId, session.id);
      const body = await this.applyRequestTag(
        this.ownerBody(session, payload.body, payload.method),
        payload.method,
      );
      let pending = this.hitl.propose({
        requestId,
        method: payload.method,
        body,
        risk: "write",
        rationale: payload.rationale ?? "Detail form save",
      });
      const startedAt = Date.now();
      if (pending.status === "validated") {
        const gate = await this.gateExistingApi(payload.method, body);
        if (gate?.decision === "apply") {
          pending = await this.hitl.awaitPermissionConfig(requestId, [
            gate.reason ||
              "No existing Document/Request/Access/Function — submit Apply",
          ]);
        }
      }
      if (pending.status !== "failed" && pending.status !== "awaiting_approval") {
        pending = await this.hitl.advance(requestId);
      }
      session.pending = pending;
      this.logPendingCall(session, pending, "opendoubao", false, startedAt);
      let configApplicationId: string | undefined;
      let configApplicationError: string | undefined;
      if (
        pending.status === "awaiting_approval" &&
        pending.permissionGate
      ) {
        const submitted = await submitConfigApplication({
          client: this.client,
          pending,
          sessionId: session.id,
          apijsonBaseUrl: this.client.baseUrl,
        });
        if (submitted.ok) configApplicationId = submitted.id;
        else if (
          submitted.error &&
          submitted.error !== "skip non-permission-gate"
        ) {
          configApplicationError = submitted.error;
        }
      }
      return {
        sessionId: session.id,
        pending,
        requestBody: body,
        configApplicationId,
        configApplicationError,
      };
    } finally {
      this.saveClientCookie(session);
    }
  }

  async adminDecide(
    requestId: string,
    action: "approve" | "reject",
    decidedBy = "admin",
    revisedBody?: Record<string, unknown>,
  ) {
    const sessionId = this.requestSessions.get(requestId);
    const session = sessionId ? this.sessions.get(sessionId) : undefined;
    if (session) {
      const login = await this.ensureApijsonLogin(session, session.apijsonAuth);
      if (!login.ok) throw new Error(login.error);
      this.bindClientCookie(session);
    }
    try {
      if (revisedBody) {
        this.hitl.revise({ requestId, body: revisedBody });
        const p = this.hitl.getPending(requestId);
        if (p && p.status === "validated") {
          await this.hitl.advance(requestId);
        }
      }
      const pending = await this.hitl.decide(requestId, action, decidedBy);
      if (session) {
        session.pending = pending;
        if (pending.status === "done" && pending.result?.ok) {
          session.lastResult = pending.result.body;
          session.dataModel.rows = pending.result.body;
        }
      }
      return {
        pending,
        approval: await this.approvals.getByRequestId(requestId),
        sessionId,
      };
    } finally {
      if (session) this.saveClientCookie(session);
    }
  }

  async boundAction(
    sessionId: string,
    action: string,
    uiPatch?: Partial<SessionState["dataModel"]["ui"]>,
    query?: {
      sorts?: ColumnSort[];
      filters?: ColumnFilter[];
      combineExpr?: string;
    },
    auth?: ApijsonAuth | null,
  ) {
    const session = this.getSession(sessionId);
    if (!session?.bind) throw new Error("no active binding; bootstrap via chat first");

    const login = await this.ensureApijsonLogin(session, auth);
    if (!login.ok) throw new Error(login.error);
    this.bindClientCookie(session);
    try {
      if (uiPatch) {
        session.dataModel.ui = { ...session.dataModel.ui, ...uiPatch };
      }

      if (!this.bound.handlesAction(session.bind.bindingId, action)) {
        if (
          ![
            "search",
            "page_change",
            "sort_change",
            "filter_change",
            "refresh",
          ].includes(action)
        ) {
          throw new Error(`action not bound: ${action}`);
        }
      }

      const bind = session.bind;
      const merged = this.bound.mergeBody(bind, session.dataModel);
      let body = applyTableQuery(
        merged,
        bind.bodyTemplate,
        query?.sorts ?? [],
        query?.filters ?? [],
        query?.combineExpr,
      );
      body = await this.applyRequestTag(body, bind.method);
      const startedAt = Date.now();
      const result = await this.client.execute(bind.method, body, bind.url);
      this.logExecute({
        session,
        source: "bound",
        operation: bind.method,
        url: bind.url,
        body,
        result,
        usedLlm: false,
        detail: `bound action=${action}`,
        startedAt,
      });

      if (result.ok) {
        session.lastResult = result.body;
        session.dataModel.rows = result.body;
      }

      const schemaComments = await commentsForPayload(
        this.client,
        body,
        result.body,
        bind.bodyTemplate,
      );
      session.dataModel.schemaComments = schemaComments;

      return {
        action,
        usedLlm: false,
        requestBody: body,
        url: bind.url,
        result,
        schemaComments,
        dataModel: session.dataModel,
        sorts: query?.sorts ?? [],
        filters: query?.filters ?? [],
      };
    } finally {
      this.saveClientCookie(session);
    }
  }

  async retryPropose(
    sessionId: string,
    body: Record<string, unknown>,
    auth?: ApijsonAuth | null,
  ) {
    const session = this.getSession(sessionId);
    if (!session?.plan) throw new Error("no plan");
    const login = await this.ensureApijsonLogin(session, auth);
    if (!login.ok) throw new Error(login.error);
    this.bindClientCookie(session);
    try {
      const requestId = session.plan.propose.requestId;
      const fixed = await this.applyRequestTag(
        this.ownerBody(
          session,
          body,
          session.plan.propose.method,
        ),
        session.plan.propose.method,
      );
      let pending = this.hitl.revise({ requestId, body: fixed });
      pending = await this.hitl.advance(requestId);
      session.pending = pending;
      session.plan.propose.body = fixed;

      if (pending.status === "done" && pending.result?.ok && session.plan.bind) {
        const bind = {
          ...session.plan.bind,
          bodyTemplate: structuredClone(fixed),
        };
        // keep read validation happy
        const v = validateProposeRequest({
          requestId,
          method: bind.method,
          body: fixed,
        });
        if (v.ok) {
          this.bound.register(bind);
          session.bind = bind;
        }
        session.dataModel.rows = pending.result.body;
      }
      return { pending, bind: session.bind, dataModel: session.dataModel };
    } finally {
      this.saveClientCookie(session);
    }
  }
}

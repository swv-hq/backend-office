/**
 * Convex monitoring helper. Sends unhandled exceptions to Sentry via the
 * envelope HTTP endpoint so it works in both V8-isolate (query/mutation) and
 * Node-runtime (action) contexts without an SDK dependency.
 */

export type CaptureOptions = {
  dsn?: string;
  context?: Record<string, unknown>;
  release?: string;
  environment?: string;
  tags?: Record<string, string>;
  user?: { id?: string; email?: string };
};

const FUNC_TYPES = new Set(["query", "mutation", "action", "http_action"]);

function parseHandlerName(name: string): {
  func: string;
  func_type: string | null;
} {
  const idx = name.indexOf(":");
  if (idx <= 0) return { func: name, func_type: null };
  const prefix = name.slice(0, idx);
  const suffix = name.slice(idx + 1);
  if (!suffix) return { func: name, func_type: null };
  return {
    func: suffix,
    func_type: FUNC_TYPES.has(prefix) ? prefix : null,
  };
}

function readServerName(): string | undefined {
  const cloudUrl = process.env.CONVEX_CLOUD_URL;
  if (cloudUrl) {
    try {
      const host = new URL(cloudUrl).host;
      const subdomain = host.split(".")[0];
      if (subdomain) return subdomain;
    } catch {
      // ignore malformed URLs
    }
  }
  return process.env.CONVEX_DEPLOYMENT || undefined;
}

type ParsedDsn = {
  publicKey: string;
  host: string;
  projectId: string;
};

let cachedDsn: ParsedDsn | null = null;
let cachedDsnString: string | undefined;

export function __resetMonitoringForTests(): void {
  cachedDsn = null;
  cachedDsnString = undefined;
}

function parseDsn(dsn: string | undefined): ParsedDsn | null {
  if (!dsn) return null;
  if (cachedDsnString === dsn && cachedDsn) return cachedDsn;
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, "");
    if (!url.username || !url.host || !projectId) return null;
    cachedDsn = {
      publicKey: url.username,
      host: url.host,
      projectId,
    };
    cachedDsnString = dsn;
    return cachedDsn;
  } catch {
    return null;
  }
}

function uuid(): string {
  // 32 hex chars, RFC4122-ish. Sentry only requires uniqueness.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function buildEvent(
  error: unknown,
  opts: CaptureOptions,
): Record<string, unknown> {
  const err = error instanceof Error ? error : new Error(String(error));
  const stack = (err.stack ?? "")
    .split("\n")
    .slice(1)
    .map((line) => ({ filename: line.trim() }));

  const event: Record<string, unknown> = {
    event_id: uuid(),
    timestamp: Date.now() / 1000,
    platform: "javascript",
    level: "error",
    exception: {
      values: [
        {
          type: err.name || "Error",
          value: err.message,
          stacktrace: { frames: stack },
        },
      ],
    },
  };

  if (opts.release) event.release = opts.release;
  if (opts.environment) event.environment = opts.environment;
  if (opts.context && Object.keys(opts.context).length > 0) {
    event.contexts = { app: opts.context };
  }
  if (opts.tags && Object.keys(opts.tags).length > 0) {
    event.tags = opts.tags;
  }
  if (opts.user && Object.keys(opts.user).length > 0) {
    event.user = opts.user;
  }
  return event;
}

export async function captureException(
  error: unknown,
  opts: CaptureOptions = {},
): Promise<void> {
  const dsn = parseDsn(opts.dsn ?? process.env.SENTRY_DSN);
  if (!dsn) return;

  const url = `https://${dsn.host}/api/${dsn.projectId}/envelope/`;
  const event = buildEvent(error, opts);
  const envelopeHeader = JSON.stringify({
    event_id: event.event_id,
    sent_at: new Date().toISOString(),
    dsn: opts.dsn ?? process.env.SENTRY_DSN,
  });
  const itemHeader = JSON.stringify({ type: "event" });
  const body = `${envelopeHeader}\n${itemHeader}\n${JSON.stringify(event)}`;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=backend-office/1.0`,
      },
      body,
    });
  } catch {
    // Never let monitoring failures break the caller.
  }
}

export function withMonitoring<TArgs, TResult>(
  name: string,
  handler: (args: TArgs) => Promise<TResult>,
  opts: CaptureOptions = {},
): (args: TArgs) => Promise<TResult> {
  return async (args: TArgs) => {
    try {
      return await handler(args);
    } catch (err) {
      await captureException(err, {
        ...opts,
        context: { ...(opts.context ?? {}), handler: name },
      });
      throw err;
    }
  };
}

export type MonitorScope = {
  setContext: (key: string, value: Record<string, unknown>) => void;
  setTag: (key: string, value: string) => void;
  setUser: (user: { id?: string; email?: string }) => void;
};

type AuthCtx = {
  auth?: {
    getUserIdentity?: () =>
      | Promise<{ tokenIdentifier?: string; email?: string } | null>
      | { tokenIdentifier?: string; email?: string }
      | null;
  };
};

async function resolveAutoUser(
  ctx: unknown,
): Promise<{ id?: string; email?: string } | undefined> {
  const auth = (ctx as AuthCtx | undefined)?.auth;
  if (!auth?.getUserIdentity) return undefined;
  try {
    const identity = await auth.getUserIdentity();
    if (!identity) return undefined;
    const id = identity.tokenIdentifier;
    if (!id) return undefined;
    return identity.email ? { id, email: identity.email } : { id };
  } catch {
    return undefined;
  }
}

export function monitored<Ctx, Args, Result>(
  name: string,
  handler: (ctx: Ctx, args: Args, scope: MonitorScope) => Promise<Result>,
  opts: CaptureOptions = {},
): (ctx: Ctx, args: Args) => Promise<Result> {
  return async (ctx, args) => {
    const scopeContexts: Record<string, Record<string, unknown>> = {};
    const scopeTags: Record<string, string> = {};
    let scopeUser: { id?: string; email?: string } | undefined;

    const scope: MonitorScope = {
      setContext: (k, v) => {
        scopeContexts[k] = v;
      },
      setTag: (k, v) => {
        scopeTags[k] = v;
      },
      setUser: (u) => {
        scopeUser = u;
      },
    };

    try {
      return await handler(ctx, args, scope);
    } catch (err) {
      const { func, func_type } = parseHandlerName(name);
      const autoTags: Record<string, string> = { func };
      if (func_type) autoTags.func_type = func_type;
      const serverName = readServerName();
      if (serverName) autoTags.server_name = serverName;

      const user = scopeUser ?? (await resolveAutoUser(ctx));

      await captureException(err, {
        ...opts,
        environment: opts.environment ?? process.env.SENTRY_ENVIRONMENT,
        release: opts.release ?? process.env.SENTRY_RELEASE,
        context: {
          ...(opts.context ?? {}),
          handler: name,
          ...scopeContexts,
        },
        tags: { ...autoTags, ...(opts.tags ?? {}), ...scopeTags },
        user,
      });
      throw err;
    }
  };
}

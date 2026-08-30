import type { ApiJsonMethod } from "@a2api/protocol";
import { isWriteMethod } from "@a2api/protocol";

/**
 * Sensitive ops wait for admin approval; other writes auto-execute
 * and still leave an auto_approved audit record.
 *
 * Default sensitive methods: delete (override via SENSITIVE_METHODS=delete,put).
 */
export function parseSensitiveMethods(
  raw?: string,
): ReadonlySet<ApiJsonMethod> {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.SENSITIVE_METHODS
      : undefined;
  const source = raw ?? fromEnv ?? "delete";
  const set = new Set<ApiJsonMethod>();
  for (const part of source.split(/[,;\s]+/)) {
    const m = part.trim().toLowerCase();
    if (
      m === "post" ||
      m === "put" ||
      m === "delete" ||
      m === "get" ||
      m === "gets" ||
      m === "head" ||
      m === "heads"
    ) {
      set.add(m);
    }
  }
  if (!set.size) set.add("delete");
  return set;
}

export function isSensitiveOperation(
  method: ApiJsonMethod,
  sensitiveMethods: ReadonlySet<ApiJsonMethod> = parseSensitiveMethods(),
): boolean {
  return sensitiveMethods.has(method);
}

/** Writes that are not sensitive may auto-execute under auto_nonsensitive policy. */
export function isAutoExecutableWrite(
  method: ApiJsonMethod,
  sensitiveMethods?: ReadonlySet<ApiJsonMethod>,
): boolean {
  return isWriteMethod(method) && !isSensitiveOperation(method, sensitiveMethods);
}

/**
 * APIJSON outermost auth codes:
 * - 401: unauthorized (some builds)
 * - 407: session expired / 未登录或登录过期 (APIJSON Demo)
 */
export function isUnauthorizedCode(code: unknown): boolean {
  return (
    code === 401 ||
    code === "401" ||
    code === 407 ||
    code === "407"
  );
}

/** Session/login errors — prompt re-login; do not submit Apply. */
export function isLoginSessionIssue(message: string): boolean {
  return /未登录|登录过期|请登录|not logged|please\s*log\s*in|session\s*expired|login\s*expired|\b401\b|\b407\b/i.test(
    message,
  );
}

/** HTTP status, JSON `code`, or msg — used by BFF retry / client logout. */
export function isApiJsonAuthFailure(opts: {
  status?: number;
  code?: unknown;
  msg?: string;
}): boolean {
  if (opts.status === 401 || opts.status === 407) return true;
  if (isUnauthorizedCode(opts.code)) return true;
  if (opts.msg && isLoginSessionIssue(opts.msg)) return true;
  return false;
}

/**
 * Permission / Access / Request-table gates — queue for admin instead of hard-fail.
 * (Form MUST/TYPE mistakes stay as normal validation failures.)
 * Login/session expiry is excluded — that needs re-login, not Apply.
 */
export function isPermissionGateIssue(message: string): boolean {
  if (isLoginSessionIssue(message)) return false;
  return /no Request row|没有权限|无权限|不允许|无访问|权限不足|Access denied|role\b.*不允许|不是本人|禁止|forbidden|unauthorized|403/i.test(
    message,
  );
}

export function partitionPermissionIssues(issues: string[]): {
  permission: string[];
  other: string[];
} {
  const permission: string[] = [];
  const other: string[] = [];
  for (const issue of issues) {
    if (isPermissionGateIssue(issue)) permission.push(issue);
    else other.push(issue);
  }
  return { permission, other };
}

/** Mirror runtime sensitivity helpers for browser write path. */

/**
 * APIJSON outermost auth codes:
 * - 401: unauthorized (some builds)
 * - 407: session expired / 未登录或登录过期 (APIJSON Demo)
 */
export function isUnauthorizedCode(code?: unknown): boolean {
  return (
    code === 401 ||
    code === "401" ||
    code === 407 ||
    code === "407"
  );
}

/** APIJSON outermost `code: 401|407` or login-expired msg. */
export function isLoginSessionIssue(
  code?: unknown,
  message?: string,
): boolean {
  if (isUnauthorizedCode(code)) return true;
  if (
    message &&
    /未登录|登录过期|请登录|not logged|please\s*log\s*in|session\s*expired|login\s*expired/i.test(
      message,
    )
  ) {
    return true;
  }
  return false;
}

/** Access/Request config gates — not login/session expiry. */
export function isPermissionGateIssue(
  message: string,
  code?: number,
): boolean {
  if (isLoginSessionIssue(code, message)) return false;
  if (code === 403) return true;
  return /no Request row|找不到.*structure|非开放请求|Request 表|nothing was written|no row ids|没有权限|无权限|不允许|无访问|权限不足|Access denied|role\b.*不允许|不是本人|禁止|forbidden|unauthorized|403/i.test(
    message,
  );
}

/**
 * Errors that should auto-submit Admin Apply from demo (not local Approve/Reject).
 * Permission gates + APIJSON parameter / illegal-request failures.
 * Login/session expiry is excluded — that needs re-login.
 */
export function isApplyTriggerIssue(
  message: string,
  code?: number,
): boolean {
  if (isLoginSessionIssue(code, message)) return false;
  if (isPermissionGateIssue(message, code)) return true;
  // APIJSON often returns outermost code 400 with 参数错误 / 不合法
  if (code === 400) return true;
  return /参数错误|参数不合法|不合法|非法|invalid\s*(argument|param|request)|illegal|bad request/i.test(
    message,
  );
}

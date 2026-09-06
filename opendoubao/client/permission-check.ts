/** Mirror runtime sensitivity helpers for browser write path. */

const PERMISSION_MSG =
  /no Request row|找不到.*structure|非开放请求|Request 表|nothing was written|no row ids|没有权限|无权限|不允许|无访问|权限不足|Access denied|role\b.*不允许|不是本人|禁止|forbidden|unauthorized|403/i;

const LOGIN_SESSION_MSG =
  /未登录|登录过期|请登录|not logged|please\s*log\s*in|session\s*expired|login\s*expired/i;

/**
 * True login/session invalidation — auto logout / re-login.
 * APIJSON Demo: 407 = 未登录或登录过期. Outermost 401 is often permission
 * (“没有权限”), not session expiry — do not treat bare 401 as logout.
 */
export function isLoginSessionIssue(
  message?: string,
  code?: number | string,
): boolean {
  const msg = typeof message === "string" ? message : "";
  // Permission gates must never force re-login (APIJSON often returns code 401).
  if (msg && PERMISSION_MSG.test(msg)) return false;

  if (code === 407 || code === "407") return true;
  if (msg && LOGIN_SESSION_MSG.test(msg)) return true;

  return false;
}

/** Access/Request config gates — not login/session expiry. */
export function isPermissionGateIssue(
  message: string,
  code?: number | string,
): boolean {
  if (isLoginSessionIssue(message, code)) return false;
  if (code === 403 || code === "403") return true;
  return PERMISSION_MSG.test(message);
}

/**
 * Errors that should auto-submit Admin Apply from demo (not local Approve/Reject).
 * Permission gates + APIJSON parameter / illegal-request failures.
 * Login/session expiry is excluded — that needs re-login.
 */
export function isApplyTriggerIssue(
  message: string,
  code?: number | string,
): boolean {
  if (isLoginSessionIssue(message, code)) return false;
  if (isPermissionGateIssue(message, code)) return true;
  // APIJSON often returns outermost code 400 with 参数错误 / 不合法
  if (code === 400 || code === "400") return true;
  return /参数错误|参数不合法|不合法|非法|invalid\s*(argument|param|request)|illegal|bad request/i.test(
    message,
  );
}

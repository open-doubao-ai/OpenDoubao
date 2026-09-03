import {
  isDataListViewPage,
  type LayoutApp,
  type LayoutPage,
} from "./page-layout.js";

/** Built-in chrome (cart / settings / scan) — no AI page bind. */
export function pageNeedsChatGenerate(page: LayoutPage): boolean {
  return (
    page === "home" ||
    page === "list" ||
    isDataListViewPage(page) ||
    page === "feed" ||
    page === "rank" ||
    page === "recommend" ||
    page === "history" ||
    page === "search" ||
    page === "category" ||
    page === "users" ||
    page === "profile" ||
    page === "favorite" ||
    page === "orders" ||
    page === "address" ||
    page === "detail" ||
    page === "form" ||
    page === "player" ||
    page === "create" ||
    page === "orderDetail" ||
    page === "addressDetail"
  );
}

export function generateLayoutPagePrompt(
  app: LayoutApp,
  page: LayoutPage,
  opts?: { tableHint?: string | null },
): string {
  const label = `${app} / ${page}`;
  const hints: string[] = [];
  if (opts?.tableHint) hints.push(`Primary table hint: ${opts.tableHint}.`);
  if (page === "rank") {
    hints.push(
      "Order by popularity (playCount, sales, viewCount, signupCount, or similar).",
    );
  } else if (page === "history") {
    hints.push("Order by date descending (recently seen / published).");
  } else if (page === "recommend") {
    hints.push("Prefer featured, high count, or recent popular rows.");
  } else if (page === "category") {
    hints.push(
      "List Category rows; if the table has an app column, filter to this app.",
    );
  } else if (page === "search") {
    hints.push("List bind that can accept a keyword filter.");
  } else if (page === "orders" || page === "orderDetail") {
    hints.push("Use the project's order table.");
  } else if (page === "address" || page === "addressDetail") {
    hints.push("Use the project's address table.");
  } else if (page === "users" || page === "profile") {
    hints.push("Use the person / User table.");
  } else if (page === "favorite") {
    hints.push("List the app's item table (favorites).");
  } else if (page === "form") {
    hints.push("Open a record form (edit existing or empty create).");
  } else if (page === "home" || page === "list" || page === "feed" || isDataListViewPage(page)) {
    hints.push("List many rows (array GET). Do not open a single-record detail.");
  }
  const shape =
    page === "create"
      ? "Open an empty create form (no list bind)."
      : page === "detail" ||
          page === "form" ||
          page === "player" ||
          page === "profile" ||
          page === "orderDetail" ||
          page === "addressDetail"
        ? "Open a single-record detail GET. Do not invent sample ids."
        : "Return one list GET bind for this page only.";
  return [
    `Generate only the "${label}" page. Do not generate any other pages.`,
    `Layout app=${app} page=${page}.`,
    ...hints,
    "Use the live schema/comments. Do not hardcode Demo names or sample ids.",
    shape,
  ].join(" ");
}

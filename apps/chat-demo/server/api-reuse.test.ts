import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { makeListPlan } from "./intent.js";
import {
  formatApiCatalogPrompt,
  overlayPlanWithDocument,
} from "./api-reuse.js";

describe("overlayPlanWithDocument", () => {
  it("replaces a list bind with a matching Document sample", () => {
    const plan = makeListPlan({
      kind: "list_table",
      title: "Moment List",
      table: "Moment",
      surfaceId: "moment_list",
      keywordField: "content",
    });
    const next = overlayPlanWithDocument(plan, [
      {
        source: "document",
        operation: "get",
        tag: "Moment",
        document: {
          url: "http://localhost:8080/get",
          request: JSON.stringify({
            "[]": { count: 15, Moment: { "@order": "id-" } },
          }),
        },
      },
    ]);
    assert.equal(
      (next.propose.body["[]"] as { count?: number })?.count,
      15,
    );
    assert.equal(next.bind?.url, "http://localhost:8080/get");
  });

  it("does not overlay a list plan with a single-record Document", () => {
    const plan = makeListPlan({
      kind: "list_table",
      title: "Moment List",
      table: "Moment",
      surfaceId: "moment_list",
      keywordField: "content",
    });
    const next = overlayPlanWithDocument(plan, [
      {
        source: "document",
        operation: "get",
        tag: "Moment",
        document: {
          request: JSON.stringify({ Moment: { id: 12 } }),
        },
      },
    ]);
    assert.ok("[]" in next.propose.body);
    assert.equal(next.propose.body.Moment, undefined);
  });

  it("formats Document-first catalog lines", () => {
    const text = formatApiCatalogPrompt([
      { source: "document", operation: "put", tag: "Moment" },
      { source: "function", operation: "get", tag: "countArray" },
    ]);
    assert.match(text, /Document/);
    assert.match(text, /\[document\] PUT Moment/);
    assert.match(text, /\[function\] GET countArray/);
  });
});

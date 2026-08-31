import { describe, expect, it } from "vitest";
import {
  buildAvailableCatalog,
  decideWriteGate,
  findDocument,
  opFromDocument,
  tagFromDocument,
} from "./api-catalog.js";

const accessMoment = {
  name: "Moment",
  alias: "Moment",
  get: '["LOGIN","UNKNOWN"]',
  head: '["LOGIN"]',
  post: "[]",
  put: '["OWNER","ADMIN"]',
  delete: '["OWNER","ADMIN"]',
};

const requestPutMoment = {
  method: "PUT",
  tag: "Moment",
  version: 1,
  structure: JSON.stringify({ MUST: "id" }),
  detail: "update moment",
};

const docPutMoment = {
  id: 11,
  name: "PUT Moment",
  operation: "PUT",
  method: "POST",
  type: "JSON",
  url: "http://localhost:8080/put",
  group: "Moment",
  request: JSON.stringify({ Moment: { id: 1, content: "x" }, tag: "Moment" }),
  version: 1,
};

const fnCount = {
  name: "countArray",
  arguments: "array",
  demo: '{"array":[1,2],"count()":"countArray(array)"}',
  detail: "count items",
  type: "Object",
  version: 0,
};

describe("api catalog reuse order", () => {
  it("parses Document url/group into operation + tag", () => {
    expect(opFromDocument(docPutMoment)).toBe("put");
    expect(tagFromDocument(docPutMoment)).toBe("Moment");
  });

  it("lists Document before Request, Access, Function", () => {
    const items = buildAvailableCatalog({
      accessRows: [accessMoment],
      requestRows: [requestPutMoment],
      documentRows: [docPutMoment],
      functionRows: [fnCount],
    });
    expect(items[0]?.source).toBe("document");
    expect(items[0]?.operation).toBe("put");
    expect(items[0]?.tag).toBe("Moment");
    expect(items.some((i) => i.source === "request" && i.tag === "Moment")).toBe(
      false,
    );
    expect(items.some((i) => i.source === "access" && i.operation === "get")).toBe(
      true,
    );
    expect(items.some((i) => i.source === "function" && i.tag === "countArray")).toBe(
      true,
    );
  });

  it("keeps Request when no Document matches", () => {
    const items = buildAvailableCatalog({
      accessRows: [accessMoment],
      requestRows: [requestPutMoment],
      documentRows: [],
      functionRows: [],
    });
    expect(items.find((i) => i.operation === "put")?.source).toBe("request");
  });

  it("finds Document by group + url", () => {
    const hit = findDocument([docPutMoment], "put", "Moment");
    expect(hit?.id).toBe(11);
  });
});

describe("write-gate reuse order", () => {
  const rows = {
    accessRows: [accessMoment],
    requestRows: [requestPutMoment],
    documentRows: [docPutMoment],
    functionRows: [fnCount],
  };

  it("prefers Document when Access allows", () => {
    const gate = decideWriteGate("put", "Moment", rows);
    expect(gate.decision).toBe("call");
    expect(gate.source).toBe("document");
    expect(gate.document?.id).toBe(11);
  });

  it("applies when Document exists but Access is missing", () => {
    const gate = decideWriteGate("put", "Moment", {
      ...rows,
      accessRows: [],
    });
    expect(gate.decision).toBe("apply");
    expect(gate.source).toBe("document");
  });

  it("reuses Request when no Document", () => {
    const gate = decideWriteGate("put", "Moment", {
      ...rows,
      documentRows: [],
    });
    expect(gate.decision).toBe("call");
    expect(gate.source).toBe("request");
  });

  it("reuses open Access GET when no Document/Request", () => {
    const gate = decideWriteGate("get", "Moment", {
      accessRows: [accessMoment],
      requestRows: [],
      documentRows: [],
      functionRows: [],
    });
    expect(gate.decision).toBe("call");
    expect(gate.source).toBe("access");
  });

  it("reuses Function when no Document/Request/Access write", () => {
    const gate = decideWriteGate("get", "countArray", {
      accessRows: [],
      requestRows: [],
      documentRows: [],
      functionRows: [fnCount],
    });
    expect(gate.decision).toBe("call");
    expect(gate.source).toBe("function");
    expect(gate.function?.name).toBe("countArray");
  });

  it("applies for a new API when nothing covers the call", () => {
    const gate = decideWriteGate("put", "Moment:custom", {
      accessRows: [accessMoment],
      requestRows: [requestPutMoment],
      documentRows: [docPutMoment],
      functionRows: [fnCount],
    });
    expect(gate.decision).toBe("apply");
    expect(gate.source).toBeNull();
    expect(gate.reason).toMatch(/new API/i);
  });

  it("tries when operation or tag is missing", () => {
    const gate = decideWriteGate("", "", rows);
    expect(gate.decision).toBe("try");
  });
});

import { describe, expect, it } from "vitest";
import {
  isNamedRequestTag,
  resolveRequestTag,
  shouldOmitOpenGetTag,
  tableNameFromRequestTag,
  variantRequestTagCandidates,
} from "./request-tag.js";

describe("APIJSON request tag", () => {
  it("parses table from named tags", () => {
    expect(tableNameFromRequestTag("Moment")).toBe("Moment");
    expect(tableNameFromRequestTag("Moment[]")).toBe("Moment");
    expect(tableNameFromRequestTag("Moment:mine")).toBe("Moment");
    expect(tableNameFromRequestTag("Comment[]:child")).toBe("Comment");
  });

  it("recognizes table-qualified tags only", () => {
    expect(isNamedRequestTag("Moment", "Moment")).toBe(true);
    expect(isNamedRequestTag("Moment[]", "Moment")).toBe(true);
    expect(isNamedRequestTag("Moment:mine", "Moment")).toBe(true);
    expect(isNamedRequestTag("moment_list", "Moment")).toBe(false);
    expect(isNamedRequestTag("moment_detail", "Moment")).toBe(false);
  });

  it("defaults to the table name", () => {
    expect(
      resolveRequestTag({
        table: "Moment",
        currentTag: "moment_detail",
        tableTagOccupied: true,
        tableTagUnfit: false,
      }),
    ).toBe("Moment");
    expect(
      resolveRequestTag({
        table: "Moment",
        tableTagOccupied: false,
        tableTagUnfit: true,
      }),
    ).toBe("Moment");
  });

  it("keeps Table[] / Table:alias", () => {
    expect(
      resolveRequestTag({
        table: "Moment",
        currentTag: "Moment[]",
        tableTagOccupied: true,
        tableTagUnfit: true,
      }),
    ).toBe("Moment[]");
    expect(
      resolveRequestTag({
        table: "Comment",
        currentTag: "Comment:circle",
        tableTagOccupied: true,
        tableTagUnfit: true,
      }),
    ).toBe("Comment:circle");
  });

  it("mints a variant only when occupied and unfit", () => {
    const variants = variantRequestTagCandidates("Moment", {
      title: "Moment Detail",
      pageId: "moment_detail",
    });
    expect(variants[0]).toBe("Moment:detail");
    expect(variants).toContain("moment_detail");
    expect(
      resolveRequestTag({
        table: "Moment",
        currentTag: "Moment",
        tableTagOccupied: true,
        tableTagUnfit: true,
        variants,
      }),
    ).toBe("Moment:detail");
  });

  it("does not mint when Request is missing", () => {
    expect(
      resolveRequestTag({
        table: "Moment",
        currentTag: "Moment",
        tableTagOccupied: false,
        tableTagUnfit: true,
        missingRequest: true,
        variants: ["Moment:detail", "moment_detail"],
      }),
    ).toBe("Moment");
  });

  it("skips occupied variants", () => {
    expect(
      resolveRequestTag({
        table: "Moment",
        tableTagOccupied: true,
        tableTagUnfit: true,
        variants: ["Moment:detail", "moment_list"],
        variantOccupied: (t) => t === "Moment:detail",
      }),
    ).toBe("moment_list");
  });

  it("builds Comment:circle from a circle page title", () => {
    expect(
      variantRequestTagCandidates("Comment", { title: "Comment Circle" }),
    ).toContain("Comment:circle");
  });

  it("omits page-slug tags on open GET", () => {
    expect(shouldOmitOpenGetTag("get", "moment_list", "Moment")).toBe(true);
    expect(shouldOmitOpenGetTag("get", "Moment", "Moment")).toBe(false);
    expect(shouldOmitOpenGetTag("post", "moment_list", "Moment")).toBe(false);
  });
});

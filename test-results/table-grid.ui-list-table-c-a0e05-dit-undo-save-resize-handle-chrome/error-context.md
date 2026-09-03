# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: table-grid.ui.spec.ts >> list table: click to focus, click again to edit, undo/save, resize handle
- Location: e2e/table-grid.ui.spec.ts:3:5

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: locator.click: Test timeout of 180000ms exceeded.
Call log:
  - waiting for locator('td.table-cell').first()
    - locator resolved to <td tabindex="-1" class="table-cell" data-row-key="101" data-path="User.tag" title="Type: Text↵Value: dev↵Click to select the cell; click again to edit">dev</td>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <vite-error-overlay></vite-error-overlay> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <vite-error-overlay></vite-error-overlay> intercepts pointer events
    - retrying click action
      - waiting 100ms
    29 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <vite-error-overlay></vite-error-overlay> intercepts pointer events
     - retrying click action
       - waiting 500ms
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- generic [ref=f4e2]:
  - banner [ref=f4e3]:
    - generic [ref=f4e4]:
      - button "UI Language" [ref=f4e6] [cursor=pointer]
      - generic [ref=f4e10]: A2API
      - tablist [ref=f4e11]:
        - tab "Chat UI" [selected] [ref=f4e12] [cursor=pointer]
        - tab "Data API" [ref=f4e13] [cursor=pointer]
      - generic [ref=f4e14]: AI Agent safely view & edit data
    - navigation "APIJSON links":
      - link "Doc" [ref=f4e15] [cursor=pointer]:
        - /url: https://github.com/Tencent/APIJSON/blob/master/Document.md
      - link "Video" [ref=f4e16] [cursor=pointer]:
        - /url: https://search.bilibili.com/all?keyword=APIJSON
      - link "Ecosys" [ref=f4e17] [cursor=pointer]:
        - /url: https://github.com/search?o=desc&q=apijson&s=stars&type=Repositories
    - generic [ref=f4e18]:
      - button "Login" [ref=f4e19] [cursor=pointer]
      - button "Settings" [ref=f4e21] [cursor=pointer]
  - generic [ref=f4e22]:
    - generic [ref=f4e23]:
      - generic [ref=f4e25]:
        - button "Moments" [ref=f4e26] [cursor=pointer]
        - button "User Detail" [ref=f4e27] [cursor=pointer]
        - button "Comments" [ref=f4e28] [cursor=pointer]
        - button "New moment" [ref=f4e29] [cursor=pointer]
        - button "Add Comment" [ref=f4e30] [cursor=pointer]
        - button "Employees" [ref=f4e31] [cursor=pointer]
        - button "Campaigns" [ref=f4e32] [cursor=pointer]
        - button "Messages" [ref=f4e33] [cursor=pointer]
        - button "News" [ref=f4e34] [cursor=pointer]
        - button "Notices" [ref=f4e35] [cursor=pointer]
        - button "Blogs" [ref=f4e36] [cursor=pointer]
        - button "Articles" [ref=f4e37] [cursor=pointer]
        - button "Videos" [ref=f4e38] [cursor=pointer]
        - button "Music" [ref=f4e39] [cursor=pointer]
        - button "Products" [ref=f4e40] [cursor=pointer]
      - generic [ref=f4e41]:
        - button "Chat mode" [ref=f4e43] [cursor=pointer]: Auto
        - textbox "e.g. List the latest 10 moments" [ref=f4e44]
        - button "Send" [ref=f4e45] [cursor=pointer]
    - separator "Resize chat and workspace" [ref=f4e46]
    - article [ref=f4e50]:
      - heading "Get started" [level=3] [ref=f4e51]
      - paragraph [ref=f4e52]: Use chat on the left to load data here. After that, filter, sort, and edit without calling AI again.
      - list [ref=f4e53]:
        - listitem [ref=f4e54]:
          - strong [ref=f4e55]: Ask or tap a chip
          - generic [ref=f4e56]: Try “List users” or “List the latest 10 moments”.
        - listitem [ref=f4e57]:
          - strong [ref=f4e58]: Explore the table
          - generic [ref=f4e59]: Filter and sort from column headers. Open ⚙ to show or hide fields (including JSON lists).
        - listitem [ref=f4e60]:
          - strong [ref=f4e61]: Open a row
          - generic [ref=f4e62]: View or edit a record, then save to return to the list.
        - listitem [ref=f4e63]:
          - strong [ref=f4e64]: Grid
          - generic [ref=f4e65]: Switch to Grid for image + name/description cards (max 20 characters).
        - listitem [ref=f4e66]:
          - strong [ref=f4e67]: Charts
          - generic [ref=f4e68]: Switch to Charts / Bar / Line to visualize the same query.
        - listitem [ref=f4e69]:
          - strong [ref=f4e70]: Data tab
          - generic [ref=f4e71]: Inspect the exact request and response when you need to debug.
      - paragraph [ref=f4e72]: Sensitive deletes wait for admin approval; other writes run automatically with an audit trail.
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("list table: click to focus, click again to edit, undo/save, resize handle", async ({
  4  |   page,
  5  | }) => {
  6  |   await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  7  | 
  8  |   await page.evaluate(async () => {
  9  |     const filters = document.getElementById("filters");
  10 |     if (filters) {
  11 |       filters.classList.remove("hidden");
  12 |       let right = filters.querySelector(".filters-right");
  13 |       if (!right) {
  14 |         right = document.createElement("div");
  15 |         right.className = "filters-right";
  16 |         filters.appendChild(right);
  17 |       }
  18 |       if (!document.getElementById("table-edit-chrome")) {
  19 |         const chrome = document.createElement("div");
  20 |         chrome.id = "table-edit-chrome";
  21 |         chrome.className = "detail-chrome table-edit-chrome";
  22 |         right.prepend(chrome);
  23 |       }
  24 |     }
  25 |     const { renderResultView } = await import("/result-view.ts");
  26 |     renderResultView(document.getElementById("result-view")!, {
  27 |       response: {
  28 |         code: 200,
  29 |         "[]": [
  30 |           { User: { id: 101, name: "Ada", tag: "dev" } },
  31 |           { User: { id: 102, name: "Bob", tag: "ops" } },
  32 |         ],
  33 |       },
  34 |       viewMode: "list",
  35 |       displayKind: "table",
  36 |       primaryTable: "User",
  37 |       layoutKindManual: true,
  38 |       layoutSpec: { app: "data", page: "table" },
  39 |       onWrite: async () => true,
  40 |     });
  41 |   });
  42 | 
  43 |   const table = page.locator(".data-table.is-grid-edit");
  44 |   await expect(table).toBeVisible({ timeout: 10_000 });
  45 | 
  46 |   await expect(page.locator("#btn-table-undo")).toBeVisible();
  47 |   await expect(page.locator("#btn-table-save")).toBeVisible();
  48 |   await expect(page.locator(".col-resize-handle").first()).toBeVisible();
  49 | 
  50 |   const cell = page.locator("td.table-cell").first();
> 51 |   await cell.click();
     |              ^ Error: locator.click: Test timeout of 180000ms exceeded.
  52 |   await expect(cell).toHaveClass(/is-focused/);
  53 |   await cell.click();
  54 |   const editor = page.locator(".table-cell-editor");
  55 |   await expect(editor).toBeVisible();
  56 |   await editor.fill("grid-edit-probe");
  57 |   await page.keyboard.press("Enter");
  58 |   await expect(page.locator("#btn-table-save")).toBeEnabled();
  59 |   await page.locator("#btn-table-undo").click();
  60 |   await expect(page.locator("#btn-table-save")).toBeDisabled();
  61 | 
  62 |   const handle = page.locator(".col-resize-handle").first();
  63 |   const path = await handle.evaluate(
  64 |     (el) => (el.parentElement as HTMLElement | null)?.dataset.path || "",
  65 |   );
  66 |   const col = page.locator(`col[data-path="${path}"]`);
  67 |   const before = await col.evaluate((el) => (el as HTMLElement).style.width);
  68 |   const box = await handle.boundingBox();
  69 |   expect(box).toBeTruthy();
  70 |   await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  71 |   await page.mouse.down();
  72 |   await page.mouse.move(box!.x + 90, box!.y + box!.height / 2, { steps: 8 });
  73 |   await page.mouse.up();
  74 |   const after = await col.evaluate((el) => (el as HTMLElement).style.width);
  75 |   expect(after).not.toBe(before);
  76 | });
  77 | 
```
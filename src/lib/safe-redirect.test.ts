import { describe, expect, it } from "vitest";
import { loginHref, safeNextPath } from "./safe-redirect";

describe("safeNextPath (QA: login return path / open-redirect guard)", () => {
  it("accepts same-site paths", () => {
    expect(safeNextPath("/checkout")).toBe("/checkout");
    expect(safeNextPath("%2Fcheckout")).toBe("/checkout");
    expect(safeNextPath("/admin/orders?view=kitchen")).toBe("/admin/orders?view=kitchen");
  });
  it("rejects external and script targets", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "evil.com", "%2F%2Fevil.com", "/%0a/evil", "%E0%A4%A"]) {
      expect(safeNextPath(bad)).toBe("/");
    }
  });
  it("falls back when empty or pointing at /login (no loop)", () => {
    expect(safeNextPath(null, "/admin")).toBe("/admin");
    expect(safeNextPath("/login?next=/x")).toBe("/");
  });
  it("round-trips through loginHref", () => {
    const href = loginHref("/checkout");
    expect(href).toBe("/login?next=%2Fcheckout");
    expect(safeNextPath(new URL(href, "http://x").searchParams.get("next"))).toBe("/checkout");
  });
});

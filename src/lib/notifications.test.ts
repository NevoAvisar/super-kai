import { describe, expect, it } from "vitest";
import type { LocalOrder } from "./local-admin";
import { customerOrderMessage, dailySummaryMessage, mailtoLink, newOrderAdminMessage, toWhatsAppNumber, whatsAppLink } from "./notifications";

const order = (over: Partial<LocalOrder> = {}): LocalOrder => ({
  id: "o1",
  orderNumber: 1001,
  userEmail: null,
  status: "CONFIRMED",
  fulfillment: "DELIVERY",
  deliveryDate: "2026-11-16",
  createdAt: "2026-11-15T08:00:00.000Z",
  contact: { name: "דנה כהן", phone: "050-1234567", email: "dana@example.com" },
  address: { city: "תל אביב", street: "הרצל", houseNumber: "1" },
  lines: [{ productId: "p1", name: "בריסקט", saleUnit: "KG", quantity: 0.75, unitPriceAgorot: 249_00, lineTotalAgorot: 186_75 }],
  totals: { subtotalAgorot: 186_75, savingsAgorot: 0, deliveryFeeAgorot: 0, totalAgorot: 186_75 },
  ...over,
});

describe("notifications (QA: Email / WhatsApp)", () => {
  it("converts Israeli numbers to wa.me format", () => {
    expect(toWhatsAppNumber("050-1234567")).toBe("972501234567");
    expect(toWhatsAppNumber("+972 50 123 4567")).toBe("972501234567");
    expect(toWhatsAppNumber("03-1234567")).toBe("97231234567");
    expect(toWhatsAppNumber("12")).toBeNull();
  });
  it("builds encoded links", () => {
    expect(whatsAppLink("0501234567", "שלום & תודה")).toBe(`https://wa.me/972501234567?text=${encodeURIComponent("שלום & תודה")}`);
    expect(whatsAppLink(null, "x")).toBe("https://wa.me/?text=x");
    expect(mailtoLink("a@b.co", "נושא", "גוף")).toMatch(/^mailto:a%40b\.co\?subject=/);
  });
  it("customer message has status, quarter-kilo quantity and total", () => {
    const m = customerOrderMessage(order());
    expect(m).toContain("שלום דנה");
    expect(m).toContain("1001");
    expect(m).toContain("0.75 ק״ג");
    expect(m).toContain("186.75");
  });
  it("admin alert shows pickup when there is no address", () => {
    expect(newOrderAdminMessage(order({ fulfillment: "PICKUP", address: null }))).toContain("איסוף עצמי");
  });
  it("daily summary sums the day, skips cancelled orders and merges dishes", () => {
    const orders = [
      order(),
      order({ id: "o2", orderNumber: 1002, fulfillment: "PICKUP", address: null }),
      order({ id: "o3", orderNumber: 1003, status: "CANCELLED" }),
      order({ id: "o4", orderNumber: 1004, deliveryDate: "2026-11-17" }),
    ];
    const m = dailySummaryMessage(orders, "2026-11-16");
    expect(m).toContain("2 הזמנות");
    expect(m).toContain("373.50");
    expect(m).toContain("1 משלוחים");
    expect(m).toContain("1 בוטלו");
    expect(m).toContain("בריסקט – 1.50 ק״ג");
  });
  it("daily summary on an empty day", () => {
    expect(dailySummaryMessage([], "2026-11-16")).toContain("אין הזמנות");
  });
});

import { describe, expect, it } from "vitest";
import { cardBrand, demoCard, demoPayment, formatCardNumber, formatExpiry, isValidIsraeliId, passesLuhn, validateCard } from "./demo-payment";

const NOW = new Date("2026-11-15T10:00:00Z");

describe("card formatting", () => {
  it("groups the number in fours and adds the expiry slash", () => {
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
    expect(formatCardNumber("41a11-1")).toBe("4111 1");
    expect(formatExpiry("1229")).toBe("12/29");
    expect(formatExpiry("1")).toBe("1");
  });

  it("recognises the brand from the prefix", () => {
    expect(cardBrand("4111")).toBe("Visa");
    expect(cardBrand("5500 00")).toBe("Mastercard");
    expect(cardBrand("9")).toBeNull();
  });
});

describe("card validation", () => {
  it("accepts the demo card", () => {
    expect(validateCard(demoCard(NOW), NOW)).toEqual({});
  });

  it("checks the Luhn digit and the Israeli ID check digit", () => {
    expect(passesLuhn("4111 1111 1111 1111")).toBe(true);
    expect(passesLuhn("4111 1111 1111 1112")).toBe(false);
    expect(passesLuhn("4111")).toBe(false);
    expect(isValidIsraeliId("123456782")).toBe(true);
    expect(isValidIsraeliId("123456789")).toBe(false);
    expect(isValidIsraeliId("000000000")).toBe(false);
  });

  it("reports each bad field", () => {
    expect(validateCard({ number: "1234", expiry: "13/30", cvv: "12", idNumber: "1" }, NOW)).toEqual({
      cardNumber: expect.any(String),
      cardExpiry: expect.any(String),
      cardCvv: expect.any(String),
      cardId: expect.any(String),
    });
  });

  it("rejects an expired card but accepts the current month", () => {
    const card = demoCard(NOW);
    expect(validateCard({ ...card, expiry: "10/26" }, NOW).cardExpiry).toBeDefined();
    expect(validateCard({ ...card, expiry: "11/26" }, NOW).cardExpiry).toBeUndefined();
  });
});

describe("demoPayment", () => {
  it("keeps only the last four digits of a card", () => {
    const p = demoPayment("CARD", demoCard(NOW), NOW);
    expect(p).toMatchObject({ method: "CARD", status: "PAID_DEMO", last4: "1111", paidAt: NOW.toISOString() });
    expect(JSON.stringify(p)).not.toContain("4111");
  });

  it("stores no card digits for a wallet", () => {
    expect(demoPayment("APPLE_PAY", undefined, NOW).last4).toBeUndefined();
  });
});

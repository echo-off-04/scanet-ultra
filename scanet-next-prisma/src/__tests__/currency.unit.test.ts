import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  SUPPORTED_CURRENCIES,
  getCurrencyInfo,
} from "@/lib/currency";

describe("formatCurrency", () => {
  it("formats EUR amount with French locale", () => {
    const result = formatCurrency(1234.56, "EUR");
    expect(result).toContain("1");
    expect(result).toContain("234");
  });

  it("formats XOF amount with CFA symbol", () => {
    const result = formatCurrency(50000, "XOF");
    expect(result).toContain("50");
    expect(result).toContain("CFA");
  });

  it("formats XAF amount with FCFA symbol", () => {
    const result = formatCurrency(25000, "XAF");
    expect(result).toContain("25");
  });

  it("rounds XOF/XAF amounts to integers", () => {
    const result = formatCurrency(1234.567, "XOF");
    expect(result).toContain("1");
    expect(result).not.toContain(".567");
  });

  it("handles zero amount", () => {
    const result = formatCurrency(0, "EUR");
    expect(result).toContain("0");
  });

  it("handles unknown currency gracefully", () => {
    const result = formatCurrency(100, "UNKNOWN");
    expect(result).toContain("100");
  });
});

describe("SUPPORTED_CURRENCIES", () => {
  it("contains 12 currencies", () => {
    expect(SUPPORTED_CURRENCIES).toHaveLength(12);
  });

  it("each currency has code, name, and symbol", () => {
    for (const curr of SUPPORTED_CURRENCIES) {
      expect(curr).toHaveProperty("code");
      expect(curr).toHaveProperty("name");
      expect(curr).toHaveProperty("symbol");
      expect(curr.code.length).toBeGreaterThanOrEqual(3);
      expect(curr.name.length).toBeGreaterThan(0);
      expect(curr.symbol.length).toBeGreaterThan(0);
    }
  });

  it("contains EUR, USD, XOF, XAF", () => {
    const codes = SUPPORTED_CURRENCIES.map((c) => c.code);
    expect(codes).toContain("EUR");
    expect(codes).toContain("USD");
    expect(codes).toContain("XOF");
    expect(codes).toContain("XAF");
  });
});

describe("getCurrencyInfo", () => {
  it("returns currency info for valid code", () => {
    const info = getCurrencyInfo("EUR");
    expect(info).toBeDefined();
    expect(info?.code).toBe("EUR");
    expect(info?.symbol).toBe("€");
  });

  it("returns undefined for invalid code", () => {
    const info = getCurrencyInfo("INVALID");
    expect(info).toBeUndefined();
  });

  it("is case-sensitive", () => {
    const info = getCurrencyInfo("eur");
    expect(info).toBeUndefined();
  });
});

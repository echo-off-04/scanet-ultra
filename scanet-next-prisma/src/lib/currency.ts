export const SUPPORTED_CURRENCIES = [
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "USD", name: "Dollar américain", symbol: "$" },
  { code: "GBP", name: "Livre sterling", symbol: "£" },
  { code: "CHF", name: "Franc suisse", symbol: "CHF" },
  { code: "CAD", name: "Dollar canadien", symbol: "CA$" },
  { code: "AUD", name: "Dollar australien", symbol: "A$" },
  { code: "JPY", name: "Yen japonais", symbol: "¥" },
  { code: "CNY", name: "Yuan chinois", symbol: "¥" },
  { code: "INR", name: "Roupie indienne", symbol: "₹" },
  { code: "BRL", name: "Réal brésilien", symbol: "R$" },
  { code: "XOF", name: "Franc CFA (BCEAO)", symbol: "CFA" },
  { code: "XAF", name: "Franc CFA (BEAC)", symbol: "FCFA" },
];

const CFA_EUR_RATE = 655.957;

let ratesCache: {
  rates: Record<string, number>;
  base: string;
  timestamp: number;
} | null = null;
const CACHE_TTL = 3600000; // 1 hour

export async function getExchangeRates(
  baseCurrency: string,
): Promise<Record<string, number>> {
  if (
    ratesCache &&
    ratesCache.base === baseCurrency &&
    Date.now() - ratesCache.timestamp < CACHE_TTL
  ) {
    return ratesCache.rates;
  }

  try {
    const effectiveBase =
      baseCurrency === "XOF" || baseCurrency === "XAF" ? "EUR" : baseCurrency;
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${effectiveBase}`,
    );
    const data = await response.json();
    const rates: Record<string, number> = { ...data.rates, [effectiveBase]: 1 };

    if (baseCurrency === "XOF" || baseCurrency === "XAF") {
      const eurToBase = CFA_EUR_RATE;
      const convertedRates: Record<string, number> = {};
      for (const [currency, rate] of Object.entries(rates)) {
        convertedRates[currency] = (rate as number) / eurToBase;
      }
      convertedRates[baseCurrency] = 1;
      convertedRates["XOF"] = 1;
      convertedRates["XAF"] = 1;
      convertedRates["EUR"] = 1 / CFA_EUR_RATE;

      ratesCache = {
        rates: convertedRates,
        base: baseCurrency,
        timestamp: Date.now(),
      };
      return convertedRates;
    }

    rates["XOF"] = CFA_EUR_RATE * (rates["EUR"] || 1);
    rates["XAF"] = CFA_EUR_RATE * (rates["EUR"] || 1);

    ratesCache = { rates, base: baseCurrency, timestamp: Date.now() };
    return rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return { [baseCurrency]: 1 };
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;

  if (
    (fromCurrency === "XOF" || fromCurrency === "XAF") &&
    toCurrency === "EUR"
  ) {
    return amount / CFA_EUR_RATE;
  }
  if (
    fromCurrency === "EUR" &&
    (toCurrency === "XOF" || toCurrency === "XAF")
  ) {
    return amount * CFA_EUR_RATE;
  }
  if (
    (fromCurrency === "XOF" && toCurrency === "XAF") ||
    (fromCurrency === "XAF" && toCurrency === "XOF")
  ) {
    return amount;
  }

  const rates = await getExchangeRates(fromCurrency);
  const rate = rates[toCurrency];
  if (!rate) return amount;
  return amount * rate;
}

export function formatCurrency(amount: number, currency: string): string {
  const currencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === currency);

  if (currency === "XOF" || currency === "XAF") {
    return `${Math.round(amount).toLocaleString("fr-FR")} ${currencyInfo?.symbol || currency}`;
  }

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function getCurrencyInfo(code: string) {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code);
}

export async function convertAllToBaseCurrency(
  items: Array<{ amount: number | null; currency: string | null }>,
  baseCurrency: string,
): Promise<number> {
  let total = 0;

  for (const item of items) {
    if (!item.amount) continue;
    const currency = item.currency || "EUR";

    if (currency === baseCurrency) {
      total += item.amount;
    } else {
      const converted = await convertCurrency(
        item.amount,
        currency,
        baseCurrency,
      );
      total += converted;
    }
  }

  return total;
}

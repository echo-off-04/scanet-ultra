/**
 * Service de conversion de devises utilisant l'API Frankfurter
 * https://api.frankfurter.dev/
 */

const FRANKFURTER_API = "https://api.frankfurter.dev/v1";

// Devises supportées avec leurs symboles et noms
export const SUPPORTED_CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "Dollar américain" },
  { code: "GBP", symbol: "£", name: "Livre sterling" },
  { code: "CHF", symbol: "CHF", name: "Franc suisse" },
  { code: "CAD", symbol: "CA$", name: "Dollar canadien" },
  { code: "AUD", symbol: "A$", name: "Dollar australien" },
  { code: "JPY", symbol: "¥", name: "Yen japonais" },
  { code: "CNY", symbol: "¥", name: "Yuan chinois" },
  { code: "INR", symbol: "₹", name: "Roupie indienne" },
  { code: "BRL", symbol: "R$", name: "Real brésilien" },
  { code: "XOF", symbol: "CFA", name: "Franc CFA BCEAO" },
  { code: "XAF", symbol: "FCFA", name: "Franc CFA BEAC" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Cache pour stocker les taux de change (durée: 1 heure)
let ratesCache: {
  data: ExchangeRates | null;
  timestamp: number;
  baseCurrency: string;
} = {
  data: null,
  timestamp: 0,
  baseCurrency: "",
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes

/**
 * Récupère les taux de change depuis l'API Frankfurter
 */
export async function getExchangeRates(
  baseCurrency: string = "EUR",
): Promise<ExchangeRates | null> {
  const now = Date.now();

  // Vérifier si le cache est valide
  if (
    ratesCache.data &&
    ratesCache.baseCurrency === baseCurrency &&
    now - ratesCache.timestamp < CACHE_DURATION
  ) {
    return ratesCache.data;
  }

  try {
    const response = await fetch(
      `${FRANKFURTER_API}/latest?base=${baseCurrency}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ExchangeRates = await response.json();

    // Mettre en cache
    ratesCache = {
      data: data,
      timestamp: now,
      baseCurrency: baseCurrency,
    };

    return data;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    // Retourner le cache même expiré en cas d'erreur
    if (ratesCache.data && ratesCache.baseCurrency === baseCurrency) {
      return ratesCache.data;
    }
    return null;
  }
}

/**
 * Convertit un montant d'une devise à une autre
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<number | null> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    // Pour les devises africaines non supportées par Frankfurter, utiliser des taux fixes
    const fixedRates: Record<string, Record<string, number>> = {
      XOF: { EUR: 0.00152449 }, // 1 XOF = 0.00152449 EUR (taux fixe CFA)
      XAF: { EUR: 0.00152449 }, // 1 XAF = 0.00152449 EUR (taux fixe CFA)
      EUR: { XOF: 655.957, XAF: 655.957 }, // 1 EUR = 655.957 CFA (taux fixe)
    };

    // Vérifier si on a un taux fixe disponible
    if (fixedRates[fromCurrency]?.[toCurrency]) {
      return amount * fixedRates[fromCurrency][toCurrency];
    }

    // Pour XOF/XAF vers d'autres devises, passer par EUR
    if (fromCurrency === "XOF" || fromCurrency === "XAF") {
      const eurAmount =
        amount * (fixedRates[fromCurrency]["EUR"] || 0.00152449);
      if (toCurrency === "EUR") {
        return eurAmount;
      }
      // Convertir EUR vers la devise cible
      return convertCurrency(eurAmount, "EUR", toCurrency);
    }

    // Pour les autres devises vers XOF/XAF, passer par EUR
    if (toCurrency === "XOF" || toCurrency === "XAF") {
      let eurAmount = amount;
      if (fromCurrency !== "EUR") {
        const eurConversion = await convertCurrency(
          amount,
          fromCurrency,
          "EUR",
        );
        if (eurConversion === null) return null;
        eurAmount = eurConversion;
      }
      return eurAmount * (fixedRates["EUR"][toCurrency] || 655.957);
    }

    // Utiliser l'API Frankfurter pour les autres conversions
    const rates = await getExchangeRates(fromCurrency);
    if (!rates || !rates.rates[toCurrency]) {
      // Essayer avec EUR comme base
      const eurRates = await getExchangeRates("EUR");
      if (!eurRates) return null;

      const fromRate =
        fromCurrency === "EUR" ? 1 : eurRates.rates[fromCurrency];
      const toRate = toCurrency === "EUR" ? 1 : eurRates.rates[toCurrency];

      if (!fromRate || !toRate) return null;

      return (amount / fromRate) * toRate;
    }

    return amount * rates.rates[toCurrency];
  } catch (error) {
    console.error("Error converting currency:", error);
    return null;
  }
}

/**
 * Formate un montant avec la devise spécifiée
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "EUR",
  locale: string = "fr-FR",
): string {
  if (amount === null || amount === undefined) {
    return "-";
  }

  try {
    // Pour XOF et XAF, utiliser un formatage personnalisé
    if (currency === "XOF" || currency === "XAF") {
      const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
      return `${formatted} ${currency === "XOF" ? "CFA" : "FCFA"}`;
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback si la devise n'est pas supportée par Intl
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}

/**
 * Récupère les informations d'une devise par son code
 */
export function getCurrencyInfo(code: string) {
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === code) || {
      code,
      symbol: code,
      name: code,
    }
  );
}

/**
 * Convertit un tableau de montants avec différentes devises vers une devise unique
 */
export async function convertAllToBaseCurrency(
  items: Array<{ amount: number | null; currency: string | null }>,
  baseCurrency: string = "EUR",
): Promise<number> {
  let total = 0;

  for (const item of items) {
    if (item.amount === null || item.amount === undefined) continue;

    const currency = item.currency || "EUR";
    const converted = await convertCurrency(
      item.amount,
      currency,
      baseCurrency,
    );

    if (converted !== null) {
      total += converted;
    } else {
      // En cas d'échec de conversion, utiliser le montant brut
      total += item.amount;
    }
  }

  return total;
}

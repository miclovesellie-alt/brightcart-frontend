import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Supported currencies with symbols and names
export const CURRENCIES = [
  { code: 'USD', symbol: '$',  name: 'US Dollar',         flag: '🇺🇸' },
  { code: 'EUR', symbol: '€',  name: 'Euro',              flag: '🇪🇺' },
  { code: 'GBP', symbol: '£',  name: 'British Pound',     flag: '🇬🇧' },
  { code: 'GHS', symbol: '₵',  name: 'Ghanaian Cedi',     flag: '🇬🇭' },
  { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira',    flag: '🇳🇬' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',      flag: '🇯🇵' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',   flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc',       flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan',      flag: '🇨🇳' },
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee',      flag: '🇮🇳' },
  { code: 'ZAR', symbol: 'R',  name: 'South African Rand',flag: '🇿🇦' },
  { code: 'AED', symbol: 'د.إ',name: 'UAE Dirham',        flag: '🇦🇪' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar',  flag: '🇸🇬' },
  { code: 'MXN', symbol: '$',  name: 'Mexican Peso',      flag: '🇲🇽' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real',    flag: '🇧🇷' },
  { code: 'KRW', symbol: '₩',  name: 'South Korean Won',  flag: '🇰🇷' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona',     flag: '🇸🇪' },
  { code: 'TRY', symbol: '₺',  name: 'Turkish Lira',      flag: '🇹🇷' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound',    flag: '🇪🇬' },
];

// Fallback rates in case the API is unreachable (rates vs USD)
const FALLBACK_RATES = {
  USD: 1, EUR: 0.92, GBP: 0.79, GHS: 15.2, NGN: 1580, JPY: 149.5,
  CAD: 1.36, AUD: 1.53, CHF: 0.88, CNY: 7.24, INR: 83.9, ZAR: 18.6,
  AED: 3.67, SGD: 1.34, MXN: 17.2, BRL: 4.95, KRW: 1325, SEK: 10.6,
  TRY: 34.1, EGP: 48.5,
};

const CurrencyContext = createContext(null);

const PREF_KEY = 'brightcart_currency';

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(
    () => localStorage.getItem(PREF_KEY) || 'USD'
  );
  const [rates, setRates]       = useState(FALLBACK_RATES);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch live rates from open.er-api.com (free, no API key required)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.result === 'success' && data.rates) {
          setRates(data.rates);
          setLastUpdated(new Date(data.time_last_update_utc));
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const setCurrency = useCallback((code) => {
    setCurrencyState(code);
    localStorage.setItem(PREF_KEY, code);
  }, []);

  // Exchange rates are quoted against USD, which remains the catalog's storage currency.
  const convertBetween = useCallback((amount, sourceCode = 'USD', targetCode = 'USD') => {
    const value = Number(amount);
    if (!Number.isFinite(value)) return 0;
    const sourceRate = rates[sourceCode] ?? 1;
    const targetRate = rates[targetCode] ?? 1;
    return (value / sourceRate) * targetRate;
  }, [rates]);

  // Convert an amount from USD to the selected currency
  const convert = useCallback((usdAmount, targetCode) => {
    return convertBetween(usdAmount, 'USD', targetCode || currency);
  }, [convertBetween, currency]);

  // Format a USD amount as a string in the selected currency
  const format = useCallback((usdAmount, targetCode) => {
    const code  = targetCode || currency;
    const meta  = CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
    const value = convert(usdAmount, code);
    // For large-value currencies (JPY, KRW, NGN) skip decimals
    const noDecimals = ['JPY', 'KRW', 'NGN'].includes(code);
    const formatted  = noDecimals
      ? Math.round(value).toLocaleString()
      : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${meta.symbol}${formatted}`;
  }, [convert, currency]);

  // Show the rate for 1 USD in a given currency
  const rateLabel = useCallback((code) => {
    const rate = rates[code] ?? 1;
    const noDecimals = ['JPY', 'KRW', 'NGN'].includes(code);
    const meta = CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
    const val  = noDecimals ? Math.round(rate).toLocaleString() : rate.toFixed(4);
    return `1 USD = ${meta.symbol}${val}`;
  }, [rates]);

  const currentMeta = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  return (
    <CurrencyContext.Provider value={{
      currency, setCurrency, rates, loading, error,
      lastUpdated, convert, convertBetween, format, rateLabel, currentMeta, CURRENCIES,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

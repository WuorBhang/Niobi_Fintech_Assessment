import { exchangeRateService } from '../services/exchangeRateService';

// Convert currency using live exchange rates
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  try {
    return exchangeRateService.convert(amount, fromCurrency, toCurrency);
  } catch (error) {
    console.error('Currency conversion error:', error);
    // Fallback to prevent crashes
    return amount;
  }
};

// Get current FX rate between currencies
export const calculateFxRate = (fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return 1;
  
  try {
    return exchangeRateService.getRate(fromCurrency, toCurrency);
  } catch (error) {
    console.error('FX rate calculation error:', error);
    return 1;
  }
};

// Get rate with realistic trading spread
export const getFxRateWithSpread = (fromCurrency, toCurrency, spreadPercent = 0.5) => {
  try {
    return exchangeRateService.getRateWithSpread(fromCurrency, toCurrency, spreadPercent);
  } catch (error) {
    console.error('FX rate with spread error:', error);
    return calculateFxRate(fromCurrency, toCurrency);
  }
};

// Validate if transfer is possible
export const validateTransfer = (sourceAccount, amount) => {
  return sourceAccount && sourceAccount.balance >= amount;
};

// Get formatted rate information
export const getRateInfo = (fromCurrency, toCurrency) => {
  try {
    return exchangeRateService.getRateInfo(fromCurrency, toCurrency);
  } catch (error) {
    console.error('Rate info error:', error);
    return {
      rate: 1,
      formatted: `1 ${fromCurrency} = 1 ${toCurrency}`,
      lastUpdate: 'Error',
      isLive: false
    };
  }
};

// Calculate transaction fees (realistic for African markets)
export const calculateTransactionFee = (amount, fromCurrency, toCurrency) => {
  let feePercent = 0;
  
  // Different fee structures for different currency pairs
  if (fromCurrency === toCurrency) {
    feePercent = 0.1; // 0.1% for same currency transfers
  } else if (fromCurrency === 'KES' || toCurrency === 'KES') {
    feePercent = 0.5; // 0.5% for KES conversions (M-Pesa fees)
  } else if (fromCurrency === 'NGN' || toCurrency === 'NGN') {
    feePercent = 0.3; // 0.3% for NGN conversions
  } else {
    feePercent = 0.25; // 0.25% for USD conversions
  }
  
  const fee = amount * (feePercent / 100);
  return {
    fee,
    feePercent,
    totalAmount: amount + fee
  };
};
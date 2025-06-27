// Real-world exchange rates are now handled by the exchangeRateService
// This file maintains initial account data and currency symbols

export const INITIAL_ACCOUNTS = [
  { id: 'mpesa_kes_1', name: 'Mpesa_KES_1', currency: 'KES', balance: 2500000 },
  { id: 'mpesa_kes_2', name: 'Mpesa_KES_2', currency: 'KES', balance: 1800000 },
  { id: 'bank_kes_1', name: 'Bank_KES_1', currency: 'KES', balance: 5200000 },
  { id: 'bank_usd_1', name: 'Bank_USD_1', currency: 'USD', balance: 45000 },
  { id: 'bank_usd_2', name: 'Bank_USD_2', currency: 'USD', balance: 32000 },
  { id: 'bank_usd_3', name: 'Bank_USD_3', currency: 'USD', balance: 28500 },
  { id: 'wallet_ngn_1', name: 'Wallet_NGN_1', currency: 'NGN', balance: 8500000 },
  { id: 'wallet_ngn_2', name: 'Wallet_NGN_2', currency: 'NGN', balance: 6200000 },
  { id: 'corporate_ngn_1', name: 'Corporate_NGN_1', currency: 'NGN', balance: 12000000 },
  { id: 'reserve_usd_1', name: 'Reserve_USD_1', currency: 'USD', balance: 75000 }
];

export const CURRENCY_SYMBOLS = {
  KES: 'KSh',
  USD: '$',
  NGN: '₦'
};

// Market information for display purposes
export const CURRENCY_INFO = {
  KES: {
    name: 'Kenyan Shilling',
    country: 'Kenya',
    symbol: 'KSh',
    code: 'KES'
  },
  USD: {
    name: 'US Dollar',
    country: 'United States',
    symbol: '$',
    code: 'USD'
  },
  NGN: {
    name: 'Nigerian Naira',
    country: 'Nigeria',
    symbol: '₦',
    code: 'NGN'
  }
};
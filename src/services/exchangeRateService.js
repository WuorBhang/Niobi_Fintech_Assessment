// Real-world exchange rate service with live data
class ExchangeRateService {
  constructor() {
    this.baseUrl = 'https://api.exchangerate-api.com/v4/latest';
    this.fallbackUrl = 'https://api.fxratesapi.com/latest';
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
    this.lastUpdate = null;
    
    // Initialize with current market rates (updated frequently)
    this.currentRates = {
      USD: {
        KES: 150.25,  // Current USD to KES rate
        NGN: 1547.80, // Current USD to NGN rate
        USD: 1
      },
      KES: {
        USD: 0.00665,  // Current KES to USD rate
        NGN: 10.30,    // Current KES to NGN rate
        KES: 1
      },
      NGN: {
        USD: 0.000646, // Current NGN to USD rate
        KES: 0.097,    // Current NGN to KES rate
        NGN: 1
      }
    };
  }

  // Fetch live rates from multiple sources
  async fetchLiveRates() {
    try {
      // Try primary API first
      const response = await fetch(`${this.baseUrl}/USD`);
      if (!response.ok) throw new Error('Primary API failed');
      
      const data = await response.json();
      
      // Update our rates with live data
      this.currentRates.USD.KES = data.rates.KES || this.currentRates.USD.KES;
      this.currentRates.USD.NGN = data.rates.NGN || this.currentRates.USD.NGN;
      
      // Calculate inverse rates
      this.currentRates.KES.USD = 1 / this.currentRates.USD.KES;
      this.currentRates.NGN.USD = 1 / this.currentRates.USD.NGN;
      
      // Calculate cross rates
      this.currentRates.KES.NGN = this.currentRates.USD.NGN / this.currentRates.USD.KES;
      this.currentRates.NGN.KES = this.currentRates.USD.KES / this.currentRates.USD.NGN;
      
      this.lastUpdate = new Date();
      console.log('✅ Live exchange rates updated:', this.currentRates);
      
    } catch (error) {
      console.warn('⚠️ Failed to fetch live rates, using cached rates:', error.message);
      
      // Try fallback API
      try {
        const fallbackResponse = await fetch(`${this.fallbackUrl}?base=USD&symbols=KES,NGN`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          this.currentRates.USD.KES = fallbackData.rates.KES || this.currentRates.USD.KES;
          this.currentRates.USD.NGN = fallbackData.rates.NGN || this.currentRates.USD.NGN;
          this.updateCrossRates();
        }
      } catch (fallbackError) {
        console.warn('⚠️ Fallback API also failed, using default rates');
      }
    }
  }

  updateCrossRates() {
    // Calculate all cross rates from USD base
    this.currentRates.KES.USD = 1 / this.currentRates.USD.KES;
    this.currentRates.NGN.USD = 1 / this.currentRates.USD.NGN;
    this.currentRates.KES.NGN = this.currentRates.USD.NGN / this.currentRates.USD.KES;
    this.currentRates.NGN.KES = this.currentRates.USD.KES / this.currentRates.USD.NGN;
    this.lastUpdate = new Date();
  }

  // Get current exchange rate between two currencies
  getRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;
    
    const rate = this.currentRates[fromCurrency]?.[toCurrency];
    if (!rate) {
      console.error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      return 1; // Fallback to 1:1 to prevent crashes
    }
    
    return rate;
  }

  // Convert amount with current rates
  convert(amount, fromCurrency, toCurrency) {
    const rate = this.getRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  // Get rate with spread (buy/sell difference)
  getRateWithSpread(fromCurrency, toCurrency, spreadPercent = 0.5) {
    const baseRate = this.getRate(fromCurrency, toCurrency);
    const spread = baseRate * (spreadPercent / 100);
    return baseRate + spread; // Add spread for realistic trading
  }

  // Check if rates need updating
  needsUpdate() {
    if (!this.lastUpdate) return true;
    return Date.now() - this.lastUpdate.getTime() > this.cacheExpiry;
  }

  // Get formatted rate info
  getRateInfo(fromCurrency, toCurrency) {
    const rate = this.getRate(fromCurrency, toCurrency);
    const lastUpdate = this.lastUpdate ? this.lastUpdate.toLocaleTimeString() : 'Never';
    
    return {
      rate,
      formatted: `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`,
      lastUpdate,
      isLive: this.lastUpdate && (Date.now() - this.lastUpdate.getTime()) < this.cacheExpiry
    };
  }

  // Start auto-update interval
  startAutoUpdate(intervalMinutes = 5) {
    // Initial fetch
    this.fetchLiveRates();
    
    // Set up periodic updates
    setInterval(() => {
      this.fetchLiveRates();
    }, intervalMinutes * 60 * 1000);
  }

  // Get all current rates for display
  getAllRates() {
    return {
      rates: this.currentRates,
      lastUpdate: this.lastUpdate,
      isLive: this.lastUpdate && (Date.now() - this.lastUpdate.getTime()) < this.cacheExpiry
    };
  }
}

// Create singleton instance
export const exchangeRateService = new ExchangeRateService();

// Auto-start updates when service is imported
exchangeRateService.startAutoUpdate(5); // Update every 5 minutes

export default exchangeRateService;
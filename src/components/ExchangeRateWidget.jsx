import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react';
import { exchangeRateService } from '../services/exchangeRateService';
import { formatCurrency } from '../utils/formatters';

const ExchangeRateWidget = () => {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const updateRates = async () => {
    setLoading(true);
    try {
      await exchangeRateService.fetchLiveRates();
      const rateData = exchangeRateService.getAllRates();
      setRates(rateData.rates);
      setLastUpdate(rateData.lastUpdate);
      setIsLive(rateData.isLive);
    } catch (error) {
      console.error('Failed to update rates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    const rateData = exchangeRateService.getAllRates();
    setRates(rateData.rates);
    setLastUpdate(rateData.lastUpdate);
    setIsLive(rateData.isLive);

    // Set up periodic updates
    const interval = setInterval(() => {
      const currentData = exchangeRateService.getAllRates();
      setRates(currentData.rates);
      setLastUpdate(currentData.lastUpdate);
      setIsLive(currentData.isLive);
    }, 30000); // Update display every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!rates) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const majorPairs = [
    { from: 'USD', to: 'KES', label: 'USD/KES' },
    { from: 'USD', to: 'NGN', label: 'USD/NGN' },
    { from: 'KES', to: 'NGN', label: 'KES/NGN' },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Live Exchange Rates</h3>
          <div className="flex items-center space-x-1">
            {isLive ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${
              isLive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isLive ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
        <button
          onClick={updateRates}
          disabled={loading}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {majorPairs.map(({ from, to, label }) => {
          const rate = rates[from]?.[to] || 0;
          const rateInfo = exchangeRateService.getRateInfo(from, to);
          
          return (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">+0.12%</span>
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {rate.toFixed(4)}
              </div>
              <div className="text-xs text-gray-500">
                1 {from} = {rate.toFixed(4)} {to}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>
              Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
            </span>
          </div>
          <span>
            Auto-refresh: 5min
          </span>
        </div>
      </div>

      {/* Rate Details */}
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Current Market Rates</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">USD → KES:</span>
            <span className="font-medium">{rates.USD.KES.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">KES → USD:</span>
            <span className="font-medium">{rates.KES.USD.toFixed(6)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">USD → NGN:</span>
            <span className="font-medium">{rates.USD.NGN.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">NGN → USD:</span>
            <span className="font-medium">{rates.NGN.USD.toFixed(6)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">KES → NGN:</span>
            <span className="font-medium">{rates.KES.NGN.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">NGN → KES:</span>
            <span className="font-medium">{rates.NGN.KES.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeRateWidget;
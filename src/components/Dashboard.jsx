import { useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, DollarSign, ArrowUpRight, Database, Wifi, WifiOff } from 'lucide-react';
import ExchangeRateWidget from './ExchangeRateWidget';

const Dashboard = ({ accounts, transactions, dbConnected }) => {
  const stats = useMemo(() => {
    const totalsByCurrency = accounts.reduce((acc, account) => {
      acc[account.currency] = (acc[account.currency] || 0) + account.balance;
      return acc;
    }, {});

    const recentTransactions = transactions.slice(0, 5);
    const completedTransactions = transactions.filter(tx => tx.status === 'completed');
    const totalTransferVolume = completedTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalsByCurrency,
      totalAccounts: accounts.length,
      totalTransactions: transactions.length,
      recentTransactions,
      totalTransferVolume
    };
  }, [accounts, transactions]);

  return (
    <div className="space-y-6">
      {/* Database Connection Status */}
      <div className={`card ${dbConnected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${dbConnected ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <Database className={`w-5 h-5 ${dbConnected ? 'text-green-600' : 'text-yellow-600'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold ${dbConnected ? 'text-green-900' : 'text-yellow-900'}`}>
                MongoDB Atlas Connection
              </h3>
              {dbConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-yellow-500" />
              )}
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                dbConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {dbConnected ? 'CONNECTED' : 'OFFLINE'}
              </span>
            </div>
            <p className={`text-sm ${dbConnected ? 'text-green-700' : 'text-yellow-700'}`}>
              {dbConnected 
                ? 'All transactions are being saved to MongoDB Atlas database'
                : 'Using local storage - transactions will not persist after refresh'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAccounts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
              {dbConnected && (
                <p className="text-xs text-green-600 mt-1">✓ Stored in MongoDB</p>
              )}
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">KES Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalsByCurrency.KES || 0, 'KES')}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-green-600 font-bold">KES</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">USD Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalsByCurrency.USD || 0, 'USD')}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-blue-600 font-bold">USD</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exchange Rate Widget */}
        <div className="lg:col-span-1">
          <ExchangeRateWidget />
        </div>

        {/* Currency Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Currency Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(stats.totalsByCurrency).map(([currency, total]) => (
              <div key={currency} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full currency-${currency.toLowerCase()}`}>
                    {currency}
                  </span>
                  <span className="text-sm text-gray-600">
                    {accounts.filter(acc => acc.currency === currency).length} accounts
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {stats.recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent transactions</p>
          ) : (
            <div className="space-y-3">
              {stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-1 bg-white rounded">
                      <ArrowUpRight className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.sourceAccountName} → {tx.targetAccountName}
                      </p>
                      <p className="text-xs text-gray-500">{tx.id}</p>
                      {dbConnected && (
                        <p className="text-xs text-green-600">✓ Saved to MongoDB</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(tx.amount, tx.sourceCurrency)}
                    </p>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
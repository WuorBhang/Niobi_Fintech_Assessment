import { useState } from 'react';
import { formatCurrency, formatDateShort } from '../utils/formatters';
import { Filter, ArrowUpRight, Clock, CheckCircle, Calendar, RotateCcw, Database } from 'lucide-react';

const TransactionTable = ({ transactions, accounts, onFilterChange, onReverseTransaction, isTransactionReversed, loading, dbConnected }) => {
  const [filters, setFilters] = useState({
    accountId: '',
    currency: '',
    status: '',
    type: ''
  });

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTransactionIcon = (tx) => {
    if (tx.type === 'reversal') {
      return <RotateCcw className="w-4 h-4 text-orange-500" />;
    }
    return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
  };

  const handleReverseClick = async (transactionId) => {
    if (window.confirm('Are you sure you want to reverse this transaction? This action will return the exact amount sent and cannot be undone.')) {
      const result = await onReverseTransaction(transactionId);
      if (!result.success) {
        alert(`Reversal failed: ${result.error}`);
      } else {
        alert('Transaction reversed successfully! The exact amount has been returned to the sender.');
      }
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          {dbConnected && (
            <div className="flex items-center space-x-1">
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                Demo Mode
              </span>
            </div>
          )}
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-500">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </span>
          {dbConnected && (
            <p className="text-xs text-blue-600">✓ Simulated storage</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Account
          </label>
          <select
            value={filters.accountId}
            onChange={(e) => handleFilterChange('accountId', e.target.value)}
            className="select-field"
          >
            <option value="">All accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Currency
          </label>
          <select
            value={filters.currency}
            onChange={(e) => handleFilterChange('currency', e.target.value)}
            className="select-field"
          >
            <option value="">All currencies</option>
            <option value="KES">KES</option>
            <option value="USD">USD</option>
            <option value="NGN">NGN</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="select-field"
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="select-field"
          >
            <option value="">All types</option>
            <option value="transfer">Transfers</option>
            <option value="reversal">Reversals</option>
          </select>
        </div>
      </div>
      
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowUpRight className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
          <p className="text-gray-500">Start by making your first transfer above</p>
          {dbConnected && (
            <p className="text-blue-600 text-sm mt-2">
              💡 This is a demo - transactions are simulated
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Transaction ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">From → To</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isReversed = isTransactionReversed(tx.id);
                const canReverse = tx.type === 'transfer' && tx.status === 'completed' && !isReversed;
                
                return (
                  <tr key={tx.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isReversed ? 'bg-red-50 border-red-200' : ''}`}>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-mono text-sm font-medium text-gray-900">{tx.id}</p>
                        {tx.note && (
                          <p className="text-sm text-gray-500 mt-1">{tx.note}</p>
                        )}
                        {tx.originalTransactionId && (
                          <p className="text-xs text-orange-600 mt-1 font-medium">
                            ↩ Reversal of: {tx.originalTransactionId}
                          </p>
                        )}
                        {isReversed && tx.type === 'transfer' && (
                          <p className="text-xs text-red-600 mt-1 font-medium">
                            ⚠ This transaction has been reversed
                          </p>
                        )}
                        {dbConnected && (
                          <p className="text-xs text-blue-600 mt-1">✓ Demo Mode</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(tx)}
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          tx.type === 'reversal' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {tx.type === 'reversal' ? 'Reversal' : 'Transfer'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{tx.sourceAccountName}</span>
                        <ArrowUpRight className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{tx.targetAccountName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(tx.amount, tx.sourceCurrency)}
                        </p>
                        {tx.sourceCurrency !== tx.targetCurrency && (
                          <p className="text-sm text-gray-500">
                            → {formatCurrency(tx.convertedAmount, tx.targetCurrency)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(tx.status)}
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                        {isReversed && tx.type === 'transfer' && (
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Reversed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-600">
                        {formatDateShort(tx.timestamp)}
                      </p>
                      {tx.scheduledDate && tx.status === 'scheduled' && (
                        <p className="text-xs text-blue-600 mt-1">
                          Scheduled: {formatDateShort(tx.scheduledDate)}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {canReverse ? (
                        <button
                          onClick={() => handleReverseClick(tx.id)}
                          disabled={loading}
                          className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reverse this transaction - returns exact amount to sender"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reverse</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {tx.type === 'reversal' ? 'Reversal' : 
                           isReversed ? 'Already Reversed' : 
                           tx.status !== 'completed' ? 'Not Completed' : 'N/A'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
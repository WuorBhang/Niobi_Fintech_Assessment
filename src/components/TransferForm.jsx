import { useState, useEffect } from 'react';
import { ArrowRight, Calendar, FileText, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { calculateFxRate, getRateInfo, calculateTransactionFee } from '../utils/calculations';

const TransferForm = ({ accounts, onTransfer, loading }) => {
  const [formData, setFormData] = useState({
    sourceAccountId: '',
    targetAccountId: '',
    amount: '',
    note: '',
    scheduledDate: ''
  });
  const [errors, setErrors] = useState({});
  const [showFxInfo, setShowFxInfo] = useState(false);
  const [rateInfo, setRateInfo] = useState(null);
  const [feeInfo, setFeeInfo] = useState(null);

  const sourceAccount = accounts.find(acc => acc.id === formData.sourceAccountId);
  const targetAccount = accounts.find(acc => acc.id === formData.targetAccountId);
  
  const isDifferentCurrency = sourceAccount && targetAccount && 
    sourceAccount.currency !== targetAccount.currency;
  
  const exchangeRate = isDifferentCurrency ? 
    calculateFxRate(sourceAccount.currency, targetAccount.currency) : 1;
  
  const convertedAmount = formData.amount ? 
    parseFloat(formData.amount) * exchangeRate : 0;

  useEffect(() => {
    setShowFxInfo(isDifferentCurrency);
    
    if (isDifferentCurrency && sourceAccount && targetAccount) {
      const info = getRateInfo(sourceAccount.currency, targetAccount.currency);
      setRateInfo(info);
    } else {
      setRateInfo(null);
    }

    // Calculate transaction fees
    if (formData.amount && sourceAccount && targetAccount) {
      const fee = calculateTransactionFee(
        parseFloat(formData.amount), 
        sourceAccount.currency, 
        targetAccount.currency
      );
      setFeeInfo(fee);
    } else {
      setFeeInfo(null);
    }
  }, [isDifferentCurrency, sourceAccount, targetAccount, formData.amount]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.sourceAccountId) {
      newErrors.sourceAccountId = 'Please select a source account';
    }
    
    if (!formData.targetAccountId) {
      newErrors.targetAccountId = 'Please select a target account';
    }
    
    if (formData.sourceAccountId === formData.targetAccountId) {
      newErrors.targetAccountId = 'Source and target accounts must be different';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (sourceAccount && formData.amount) {
      const totalAmount = feeInfo ? feeInfo.totalAmount : parseFloat(formData.amount);
      if (totalAmount > sourceAccount.balance) {
        newErrors.amount = `Amount + fees (${formatCurrency(totalAmount, sourceAccount.currency)}) exceeds available balance`;
      }
    }
    
    if (formData.scheduledDate) {
      const scheduledDate = new Date(formData.scheduledDate);
      const now = new Date();
      if (scheduledDate <= now) {
        newErrors.scheduledDate = 'Scheduled date must be in the future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await onTransfer({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    
    if (result.success) {
      setFormData({
        sourceAccountId: '',
        targetAccountId: '',
        amount: '',
        note: '',
        scheduledDate: ''
      });
      setErrors({});
      setRateInfo(null);
      setFeeInfo(null);
    } else {
      setErrors({ submit: result.error });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <ArrowRight className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Transfer Funds</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Account
            </label>
            <select
              value={formData.sourceAccountId}
              onChange={(e) => handleInputChange('sourceAccountId', e.target.value)}
              className={`select-field ${errors.sourceAccountId ? 'border-red-300' : ''}`}
            >
              <option value="">Select source account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {formatCurrency(account.balance, account.currency)}
                </option>
              ))}
            </select>
            {errors.sourceAccountId && (
              <p className="mt-1 text-sm text-red-600">{errors.sourceAccountId}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Account
            </label>
            <select
              value={formData.targetAccountId}
              onChange={(e) => handleInputChange('targetAccountId', e.target.value)}
              className={`select-field ${errors.targetAccountId ? 'border-red-300' : ''}`}
            >
              <option value="">Select target account</option>
              {accounts
                .filter(account => account.id !== formData.sourceAccountId)
                .map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.currency}
                  </option>
                ))}
            </select>
            {errors.targetAccountId && (
              <p className="mt-1 text-sm text-red-600">{errors.targetAccountId}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount {sourceAccount && `(${sourceAccount.currency})`}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            className={`input-field ${errors.amount ? 'border-red-300' : ''}`}
            placeholder="Enter amount to transfer"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
          {sourceAccount && formData.amount && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-500">
                Available balance: {formatCurrency(sourceAccount.balance, sourceAccount.currency)}
              </p>
              {feeInfo && (
                <p className="text-sm text-blue-600">
                  Transaction fee: {formatCurrency(feeInfo.fee, sourceAccount.currency)} ({feeInfo.feePercent}%)
                </p>
              )}
            </div>
          )}
        </div>
        
        {showFxInfo && formData.amount && rateInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-2">Live Currency Conversion</h4>
                <div className="space-y-2">
                  <p className="text-sm text-blue-700">
                    {formatCurrency(parseFloat(formData.amount), sourceAccount.currency)} will be converted to{' '}
                    <span className="font-semibold">
                      {formatCurrency(convertedAmount, targetAccount.currency)}
                    </span>
                  </p>
                  <div className="flex items-center justify-between text-xs text-blue-600 bg-blue-100 rounded px-2 py-1">
                    <span>Exchange rate: {rateInfo.formatted}</span>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${rateInfo.isLive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>{rateInfo.isLive ? 'LIVE' : 'CACHED'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600">
                    Last updated: {rateInfo.lastUpdate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {feeInfo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Transaction Summary</h4>
                <div className="mt-2 space-y-1 text-sm text-yellow-700">
                  <div className="flex justify-between">
                    <span>Transfer amount:</span>
                    <span>{formatCurrency(parseFloat(formData.amount || 0), sourceAccount?.currency || 'USD')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction fee ({feeInfo.feePercent}%):</span>
                    <span>{formatCurrency(feeInfo.fee, sourceAccount?.currency || 'USD')}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-yellow-300 pt-1">
                    <span>Total deducted:</span>
                    <span>{formatCurrency(feeInfo.totalAmount, sourceAccount?.currency || 'USD')}</span>
                  </div>
                  {isDifferentCurrency && (
                    <div className="flex justify-between text-green-700">
                      <span>Recipient receives:</span>
                      <span>{formatCurrency(convertedAmount, targetAccount?.currency || 'USD')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Note (Optional)
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            className="input-field"
            rows="3"
            placeholder="Add a note for this transfer..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Schedule Transfer (Optional)
          </label>
          <input
            type="datetime-local"
            value={formData.scheduledDate}
            onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
            className={`input-field ${errors.scheduledDate ? 'border-red-300' : ''}`}
            min={new Date().toISOString().slice(0, 16)}
          />
          {errors.scheduledDate && (
            <p className="mt-1 text-sm text-red-600">{errors.scheduledDate}</p>
          )}
          {formData.scheduledDate && (
            <p className="mt-1 text-sm text-gray-500">
              Transfer will be executed on {formatDate(formData.scheduledDate)}
            </p>
          )}
        </div>
        
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing Transfer...' : 'Execute Transfer'}
        </button>
      </form>
    </div>
  );
};

export default TransferForm;
import { formatCurrency } from '../utils/formatters';
import { Wallet, Building2, Smartphone } from 'lucide-react';

const AccountCard = ({ account, isSelected, onSelect, showSelection = false }) => {
  const getAccountIcon = (accountName) => {
    if (accountName.toLowerCase().includes('mpesa')) return Smartphone;
    if (accountName.toLowerCase().includes('bank')) return Building2;
    return Wallet;
  };

  const Icon = getAccountIcon(account.name);
  
  return (
    <div 
      className={`card cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
      } ${showSelection ? 'hover:ring-1 hover:ring-primary-300' : ''}`}
      onClick={() => showSelection && onSelect?.(account)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg currency-${account.currency.toLowerCase()}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{account.name}</h3>
            <p className="text-sm text-gray-500">{account.currency} Account</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(account.balance, account.currency)}
          </p>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full currency-${account.currency.toLowerCase()}`}>
            {account.currency}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
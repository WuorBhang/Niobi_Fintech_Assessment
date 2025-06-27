import { format } from 'date-fns';

export const formatCurrency = (amount, currency) => {
  const symbols = {
    KES: 'KSh',
    USD: '$',
    NGN: '₦'
  };
  
  return `${symbols[currency]} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatDateShort = (date) => {
  return format(new Date(date), 'MMM dd, HH:mm');
};

export const generateTransactionId = () => {
  return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
};
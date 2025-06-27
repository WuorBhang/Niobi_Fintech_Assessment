import { useState, useCallback, useEffect } from 'react';
import { INITIAL_ACCOUNTS } from '../data/initialData';
import { convertCurrency, validateTransfer } from '../utils/calculations';
import { generateTransactionId } from '../utils/formatters';
import { databaseService } from '../services/databaseService';

export const useTreasury = () => {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState([]);
  const [reversedTransactions, setReversedTransactions] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Initialize database connection and load data
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const connected = await databaseService.connect();
        setDbConnected(connected);
        
        if (connected) {
          // Load existing transactions from MongoDB
          const result = await databaseService.getTransactions();
          if (result.success) {
            setTransactions(result.data);
            console.log(`✅ Loaded ${result.data.length} transactions from MongoDB`);
          }
          
          // Load reversals
          const reversalsResult = await databaseService.getReversals();
          if (reversalsResult.success) {
            const reversedIds = new Set(
              reversalsResult.data.map(r => r.originalTransactionId)
            );
            setReversedTransactions(reversedIds);
            console.log(`✅ Loaded ${reversalsResult.data.length} reversals from MongoDB`);
          }
        }
      } catch (error) {
        console.error('❌ Database initialization failed:', error);
        setDbConnected(false);
      }
    };

    initializeDatabase();
  }, []);

  const executeTransfer = useCallback(async (transferData) => {
    setLoading(true);
    
    try {
      const { sourceAccountId, targetAccountId, amount, note, scheduledDate } = transferData;
      
      const sourceAccount = accounts.find(acc => acc.id === sourceAccountId);
      const targetAccount = accounts.find(acc => acc.id === targetAccountId);
      
      if (!sourceAccount || !targetAccount) {
        throw new Error('Invalid account selection');
      }
      
      if (!validateTransfer(sourceAccount, amount)) {
        throw new Error('Insufficient balance in source account');
      }
      
      const isScheduled = scheduledDate && new Date(scheduledDate) > new Date();
      const status = isScheduled ? 'scheduled' : 'completed';
      
      const transaction = {
        id: generateTransactionId(),
        sourceAccountId,
        targetAccountId,
        sourceAccountName: sourceAccount.name,
        targetAccountName: targetAccount.name,
        amount,
        sourceCurrency: sourceAccount.currency,
        targetCurrency: targetAccount.currency,
        exchangeRate: sourceAccount.currency !== targetAccount.currency ? 
          convertCurrency(1, sourceAccount.currency, targetAccount.currency) : 1,
        convertedAmount: sourceAccount.currency !== targetAccount.currency ? 
          convertCurrency(amount, sourceAccount.currency, targetAccount.currency) : amount,
        note: note || '',
        timestamp: new Date().toISOString(),
        scheduledDate: scheduledDate || null,
        status,
        type: 'transfer',
        reversible: true
      };
      
      // Save to MongoDB if connected
      if (dbConnected) {
        const saveResult = await databaseService.saveTransaction(transaction);
        if (!saveResult.success) {
          console.warn('⚠️ Failed to save to MongoDB, continuing with local storage');
        }
      }
      
      // Only update balances if not scheduled
      if (!isScheduled) {
        setAccounts(prevAccounts => 
          prevAccounts.map(account => {
            if (account.id === sourceAccountId) {
              return { ...account, balance: account.balance - amount };
            }
            if (account.id === targetAccountId) {
              const convertedAmount = sourceAccount.currency !== targetAccount.currency ? 
                convertCurrency(amount, sourceAccount.currency, targetAccount.currency) : amount;
              return { ...account, balance: account.balance + convertedAmount };
            }
            return account;
          })
        );
      }
      
      setTransactions(prev => [transaction, ...prev]);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, transaction };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [accounts, dbConnected]);

  const reverseTransaction = useCallback(async (transactionId) => {
    setLoading(true);
    
    try {
      // Check if transaction is already reversed
      let isAlreadyReversed = reversedTransactions.has(transactionId);
      
      // Double-check with MongoDB if connected
      if (dbConnected && !isAlreadyReversed) {
        isAlreadyReversed = await databaseService.isTransactionReversed(transactionId);
      }
      
      if (isAlreadyReversed) {
        throw new Error('Transaction has already been reversed. Each transaction can only be reversed once.');
      }

      const originalTransaction = transactions.find(tx => tx.id === transactionId);
      
      if (!originalTransaction) {
        throw new Error('Transaction not found');
      }

      if (originalTransaction.status !== 'completed') {
        throw new Error('Only completed transactions can be reversed');
      }

      if (!originalTransaction.reversible || originalTransaction.type === 'reversal') {
        throw new Error('This transaction cannot be reversed');
      }

      const sourceAccount = accounts.find(acc => acc.id === originalTransaction.sourceAccountId);
      const targetAccount = accounts.find(acc => acc.id === originalTransaction.targetAccountId);

      if (!sourceAccount || !targetAccount) {
        throw new Error('Original transaction accounts not found');
      }

      // Check if target account has sufficient balance for reversal
      const reversalAmount = originalTransaction.convertedAmount || originalTransaction.amount;
      if (targetAccount.balance < reversalAmount) {
        throw new Error('Insufficient balance in recipient account for reversal. Cannot reverse more than what was received.');
      }

      // Create reversal transaction
      const reversalTransaction = {
        id: generateTransactionId(),
        sourceAccountId: originalTransaction.targetAccountId,
        targetAccountId: originalTransaction.sourceAccountId,
        sourceAccountName: originalTransaction.targetAccountName,
        targetAccountName: originalTransaction.sourceAccountName,
        amount: originalTransaction.convertedAmount || originalTransaction.amount,
        sourceCurrency: originalTransaction.targetCurrency,
        targetCurrency: originalTransaction.sourceCurrency,
        exchangeRate: originalTransaction.exchangeRate ? (1 / originalTransaction.exchangeRate) : 1,
        convertedAmount: originalTransaction.amount,
        note: `Reversal of transaction ${originalTransaction.id}`,
        timestamp: new Date().toISOString(),
        scheduledDate: null,
        status: 'completed',
        type: 'reversal',
        originalTransactionId: originalTransaction.id,
        reversible: false
      };

      // Save reversal to MongoDB if connected
      if (dbConnected) {
        const reversalData = {
          originalTransactionId: originalTransaction.id,
          reversalTransactionId: reversalTransaction.id,
          timestamp: new Date().toISOString(),
          amount: reversalAmount,
          reason: 'Manual reversal'
        };
        
        const saveResult = await databaseService.saveReversal(reversalData);
        if (!saveResult.success) {
          console.warn('⚠️ Failed to save reversal to MongoDB');
        }
        
        // Also save the reversal transaction
        await databaseService.saveTransaction(reversalTransaction);
      }

      // Update account balances
      setAccounts(prevAccounts => 
        prevAccounts.map(account => {
          if (account.id === originalTransaction.targetAccountId) {
            return { ...account, balance: account.balance - reversalAmount };
          }
          if (account.id === originalTransaction.sourceAccountId) {
            return { ...account, balance: account.balance + originalTransaction.amount };
          }
          return account;
        })
      );

      // Add reversal transaction and mark original as reversed
      setTransactions(prev => [reversalTransaction, ...prev]);
      setReversedTransactions(prev => new Set([...prev, transactionId]));

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, reversalTransaction };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [accounts, transactions, reversedTransactions, dbConnected]);

  const getAccountById = useCallback((id) => {
    return accounts.find(account => account.id === id);
  }, [accounts]);

  const getFilteredTransactions = useCallback((filters) => {
    let filtered = transactions;
    
    if (filters.accountId) {
      filtered = filtered.filter(tx => 
        tx.sourceAccountId === filters.accountId || tx.targetAccountId === filters.accountId
      );
    }
    
    if (filters.currency) {
      filtered = filtered.filter(tx => 
        tx.sourceCurrency === filters.currency || tx.targetCurrency === filters.currency
      );
    }
    
    if (filters.status) {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter(tx => tx.type === filters.type);
    }
    
    return filtered;
  }, [transactions]);

  const isTransactionReversed = useCallback((transactionId) => {
    return reversedTransactions.has(transactionId);
  }, [reversedTransactions]);

  return {
    accounts,
    transactions,
    loading,
    dbConnected,
    executeTransfer,
    reverseTransaction,
    getAccountById,
    getFilteredTransactions,
    isTransactionReversed
  };
};
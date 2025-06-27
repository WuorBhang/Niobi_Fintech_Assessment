class DatabaseService {
  constructor() {
    // For production deployment, we'll use a different approach
    // Since we can't run a separate backend in static hosting
    this.baseUrl = null; // Will be set based on environment
    this.isConnected = false;
    this.connectionString = 'mongodb+srv://NiobiFintechAssessment:NiobiFintechAssessment@niobifintechassessment.1uep0g9.mongodb.net/?retryWrites=true&w=majority';
    
    // For demo purposes, we'll simulate database operations
    this.simulateDatabase = true;
  }

  // Initialize connection (simulated for static deployment)
  async connect() {
    try {
      // In a static deployment, we can't connect to MongoDB directly
      // This would normally require a backend server
      console.log('🔄 Simulating database connection for demo...');
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isConnected = true;
      console.log('✅ Database connection simulated successfully');
      return true;
    } catch (error) {
      console.error('❌ Database connection simulation failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Save transaction (simulated)
  async saveTransaction(transaction) {
    try {
      if (!this.simulateDatabase) {
        throw new Error('Database not available');
      }
      
      // Simulate saving to localStorage for demo
      const transactions = JSON.parse(localStorage.getItem('treasury_transactions') || '[]');
      transactions.push({
        ...transaction,
        _id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      localStorage.setItem('treasury_transactions', JSON.stringify(transactions));
      
      console.log('✅ Transaction saved to local storage (simulated MongoDB)');
      return { success: true, data: transaction };
    } catch (error) {
      console.error('❌ Failed to save transaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all transactions (simulated)
  async getTransactions(filters = {}) {
    try {
      if (!this.simulateDatabase) {
        return { success: false, error: 'Database not available', data: [] };
      }
      
      const transactions = JSON.parse(localStorage.getItem('treasury_transactions') || '[]');
      console.log(`✅ Retrieved ${transactions.length} transactions from local storage`);
      return { success: true, data: transactions };
    } catch (error) {
      console.error('❌ Failed to fetch transactions:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Update transaction (simulated)
  async updateTransaction(transactionId, updates) {
    try {
      if (!this.simulateDatabase) {
        throw new Error('Database not available');
      }
      
      const transactions = JSON.parse(localStorage.getItem('treasury_transactions') || '[]');
      const index = transactions.findIndex(tx => tx.id === transactionId);
      
      if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updates, updatedAt: new Date() };
        localStorage.setItem('treasury_transactions', JSON.stringify(transactions));
        console.log('✅ Transaction updated in local storage');
        return { success: true, modifiedCount: 1 };
      }
      
      return { success: false, error: 'Transaction not found' };
    } catch (error) {
      console.error('❌ Failed to update transaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Save reversal (simulated)
  async saveReversal(reversal) {
    try {
      if (!this.simulateDatabase) {
        throw new Error('Database not available');
      }
      
      const reversals = JSON.parse(localStorage.getItem('treasury_reversals') || '[]');
      reversals.push({
        ...reversal,
        _id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      localStorage.setItem('treasury_reversals', JSON.stringify(reversals));
      
      console.log('✅ Reversal saved to local storage (simulated MongoDB)');
      return { success: true, data: reversal };
    } catch (error) {
      console.error('❌ Failed to save reversal:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all reversals (simulated)
  async getReversals() {
    try {
      if (!this.simulateDatabase) {
        return { success: false, error: 'Database not available', data: [] };
      }
      
      const reversals = JSON.parse(localStorage.getItem('treasury_reversals') || '[]');
      return { success: true, data: reversals };
    } catch (error) {
      console.error('❌ Failed to fetch reversals:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Check if transaction is reversed (simulated)
  async isTransactionReversed(transactionId) {
    try {
      if (!this.simulateDatabase) {
        return false;
      }
      
      const reversals = JSON.parse(localStorage.getItem('treasury_reversals') || '[]');
      return reversals.some(r => r.originalTransactionId === transactionId);
    } catch (error) {
      console.error('❌ Failed to check reversal status:', error);
      return false;
    }
  }

  // Get transaction statistics (simulated)
  async getTransactionStats() {
    try {
      if (!this.simulateDatabase) {
        return { success: false, data: {} };
      }
      
      const transactions = JSON.parse(localStorage.getItem('treasury_transactions') || '[]');
      
      const stats = {
        general: {
          totalTransactions: transactions.length,
          completedTransactions: transactions.filter(tx => tx.status === 'completed').length,
          pendingTransactions: transactions.filter(tx => tx.status === 'pending').length,
          scheduledTransactions: transactions.filter(tx => tx.status === 'scheduled').length,
          totalAmount: transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
        },
        byCurrency: transactions.reduce((acc, tx) => {
          const currency = tx.sourceCurrency || 'USD';
          if (!acc[currency]) {
            acc[currency] = { _id: currency, count: 0, totalAmount: 0 };
          }
          acc[currency].count++;
          acc[currency].totalAmount += tx.amount || 0;
          return acc;
        }, {})
      };
      
      return { success: true, data: stats };
    } catch (error) {
      console.error('❌ Failed to fetch transaction stats:', error);
      return { success: false, data: {} };
    }
  }
}

// Create singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
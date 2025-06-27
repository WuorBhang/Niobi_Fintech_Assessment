import axios from 'axios';

class DatabaseService {
  constructor() {
    this.baseUrl = 'http://localhost:3001/api'; // Backend API URL
    this.isConnected = false;
    this.connectionString = 'mongodb+srv://NiobiFintechAssessment:NiobiFintechAssessment@niobifintechassessment.1uep0g9.mongodb.net/?retryWrites=true&w=majority';
  }

  // Initialize connection (called from backend)
  async connect() {
    try {
      const response = await axios.post(`${this.baseUrl}/connect`, {
        connectionString: this.connectionString
      });
      this.isConnected = response.data.success;
      console.log('✅ MongoDB connection established');
      return this.isConnected;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Save transaction to MongoDB
  async saveTransaction(transaction) {
    try {
      const response = await axios.post(`${this.baseUrl}/transactions`, {
        ...transaction,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Transaction saved to MongoDB:', response.data._id);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to save transaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all transactions from MongoDB
  async getTransactions(filters = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/transactions`, {
        params: filters
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to fetch transactions:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Update transaction (for reversals)
  async updateTransaction(transactionId, updates) {
    try {
      const response = await axios.put(`${this.baseUrl}/transactions/${transactionId}`, {
        ...updates,
        updatedAt: new Date()
      });
      
      console.log('✅ Transaction updated in MongoDB');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to update transaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Save reversal transaction
  async saveReversal(reversal) {
    try {
      const response = await axios.post(`${this.baseUrl}/reversals`, {
        ...reversal,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Reversal saved to MongoDB:', response.data._id);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to save reversal:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all reversals
  async getReversals() {
    try {
      const response = await axios.get(`${this.baseUrl}/reversals`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to fetch reversals:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Check if transaction is reversed
  async isTransactionReversed(transactionId) {
    try {
      const response = await axios.get(`${this.baseUrl}/reversals/check/${transactionId}`);
      return response.data.isReversed;
    } catch (error) {
      console.error('❌ Failed to check reversal status:', error);
      return false;
    }
  }

  // Get transaction statistics
  async getTransactionStats() {
    try {
      const response = await axios.get(`${this.baseUrl}/transactions/stats`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to fetch transaction stats:', error);
      return { success: false, data: {} };
    }
  }
}

// Create singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://NiobiFintechAssessment:NiobiFintechAssessment@niobifintechassessment.1uep0g9.mongodb.net/?retryWrites=true&w=majority';
let db;
let client;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('treasury_management');
    console.log('✅ Connected to MongoDB Atlas');
    
    // Create indexes for better performance
    await db.collection('transactions').createIndex({ id: 1 }, { unique: true });
    await db.collection('transactions').createIndex({ timestamp: -1 });
    await db.collection('transactions').createIndex({ sourceAccountId: 1 });
    await db.collection('transactions').createIndex({ targetAccountId: 1 });
    await db.collection('transactions').createIndex({ status: 1 });
    
    await db.collection('reversals').createIndex({ originalTransactionId: 1 }, { unique: true });
    await db.collection('reversals').createIndex({ timestamp: -1 });
    
    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Connect to database endpoint
app.post('/api/connect', async (req, res) => {
  try {
    if (!db) {
      await connectToMongoDB();
    }
    res.json({ success: true, message: 'Connected to MongoDB' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Transaction endpoints
app.post('/api/transactions', async (req, res) => {
  try {
    const transaction = {
      ...req.body,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('transactions').insertOne(transaction);
    res.json({ ...transaction, _id: result.insertedId });
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const { accountId, currency, status, type, limit = 100 } = req.query;
    
    // Build filter query
    const filter = {};
    if (accountId) {
      filter.$or = [
        { sourceAccountId: accountId },
        { targetAccountId: accountId }
      ];
    }
    if (currency) {
      filter.$or = [
        { sourceCurrency: currency },
        { targetCurrency: currency }
      ];
    }
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const transactions = await db.collection('transactions')
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const result = await db.collection('transactions').updateOne(
      { id: id },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reversal endpoints
app.post('/api/reversals', async (req, res) => {
  try {
    const reversal = {
      ...req.body,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('reversals').insertOne(reversal);
    res.json({ ...reversal, _id: result.insertedId });
  } catch (error) {
    console.error('Error saving reversal:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reversals', async (req, res) => {
  try {
    const reversals = await db.collection('reversals')
      .find({})
      .sort({ timestamp: -1 })
      .toArray();
    
    res.json(reversals);
  } catch (error) {
    console.error('Error fetching reversals:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reversals/check/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const reversal = await db.collection('reversals').findOne({
      originalTransactionId: transactionId
    });
    
    res.json({ isReversed: !!reversal });
  } catch (error) {
    console.error('Error checking reversal status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Transaction statistics endpoint
app.get('/api/transactions/stats', async (req, res) => {
  try {
    const stats = await db.collection('transactions').aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          completedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          scheduledTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
          }
        }
      }
    ]).toArray();
    
    const currencyStats = await db.collection('transactions').aggregate([
      {
        $group: {
          _id: '$sourceCurrency',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]).toArray();
    
    res.json({
      general: stats[0] || {},
      byCurrency: currencyStats
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Treasury Management API running on port ${PORT}`);
  await connectToMongoDB();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://simpleitsolucoes:%40n%40R%40quel110987@portalrm.ckh4qik.mongodb.net/?appName=PortalRM';

export const connectToMongo = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: 'portalrm_db',
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    // Não lançar erro para não derrubar o servidor, mas as operações falharão
  }
};

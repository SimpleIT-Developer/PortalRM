import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://simpleitsolucoes:%40n%40R%40quel110987@portalrm.ckh4qik.mongodb.net/?appName=PortalRM';

export const connectToMongo = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
  }
};

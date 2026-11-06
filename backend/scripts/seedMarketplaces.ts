import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Marketplace from '../src/models/Marketplace';
import connectDB from '../src/config/db';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedMarketplaces = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const marketplaces = [
      {
        name: 'Amazon India',
        code: 'amazon',
        country: 'IN',
        currency: 'INR',
        status: 'Active',
      },
      {
        name: 'Flipkart',
        code: 'flipkart',
        country: 'IN',
        currency: 'INR',
        status: 'Active',
      },
      {
        name: 'Meesho',
        code: 'meesho',
        country: 'IN',
        currency: 'INR',
        status: 'Active',
      },
    ];

    for (const data of marketplaces) {
      // Idempotent upsert
      await Marketplace.findOneAndUpdate(
        { code: data.code },
        { $set: data },
        { upsert: true, new: true }
      );
      console.log(`✅ Upserted Marketplace: ${data.name}`);
    }

    console.log('Marketplace seeding complete.');
    process.exit(0);
  } catch (error: any) {
    console.error('Error seeding marketplaces:', error.message);
    process.exit(1);
  }
};

seedMarketplaces();

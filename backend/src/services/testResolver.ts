import mongoose from 'mongoose';
import connectDB from '../config/db';
import dotenv from 'dotenv';
import MarketplaceFeeRule from '../models/MarketplaceFeeRule';
import { RuleResolverService } from './RuleResolverService';
import Marketplace from '../models/Marketplace';

dotenv.config();

async function runTests() {
  await connectDB();
  console.log('--- Starting RuleResolver Tests ---');

  // Setup: Clean up existing rules
  await MarketplaceFeeRule.deleteMany({});
  await Marketplace.deleteMany({});

  const marketplace = new Marketplace({ name: 'Amazon', code: 'amazon' });
  await marketplace.save();

  // Test Case 1: Specificity
  // Create generic rule
  await MarketplaceFeeRule.create({
    marketplaceId: marketplace._id,
    marketplaceCode: 'amazon',
    feeType: 'referral',
    calculationMethod: 'percentage',
    percentage: 10,
    effectiveFrom: new Date('2024-01-01'),
    source: 'Test',
    confidence: 'Verified'
  });

  // Create specific rule
  await MarketplaceFeeRule.create({
    marketplaceId: marketplace._id,
    marketplaceCode: 'amazon',
    feeType: 'referral',
    fulfilmentType: 'Easy Ship',
    priceMin: 0,
    priceMax: 500,
    calculationMethod: 'percentage',
    percentage: 13,
    effectiveFrom: new Date('2024-01-01'),
    source: 'Test',
    confidence: 'Verified'
  });

  const result1 = await RuleResolverService.resolve({
    marketplaceCode: 'amazon',
    feeType: 'referral',
    fulfilmentType: 'Easy Ship',
    price: 300
  });

  if (result1.percentage === 13 && result1.matchDetails?.fulfilment === 'exact') {
    console.log('✅ Test 1 Passed: Specific rule beat generic rule.');
  } else {
    console.error('❌ Test 1 Failed:', result1);
  }

  // Test Case 2: Conflict Detection
  // Create another identical specific rule
  await MarketplaceFeeRule.create({
    marketplaceId: marketplace._id,
    marketplaceCode: 'amazon',
    feeType: 'referral',
    fulfilmentType: 'Easy Ship',
    priceMin: 0,
    priceMax: 500,
    calculationMethod: 'percentage',
    percentage: 15,
    effectiveFrom: new Date('2024-01-01'),
    source: 'Test',
    confidence: 'Verified'
  });

  try {
    await RuleResolverService.resolve({
      marketplaceCode: 'amazon',
      feeType: 'referral',
      fulfilmentType: 'Easy Ship',
      price: 300
    });
    console.error('❌ Test 2 Failed: Did not throw conflict error.');
  } catch (error: any) {
    if (error.message.includes('conflict detected')) {
      console.log('✅ Test 2 Passed: Caught identical rule conflict successfully.');
    } else {
      console.error('❌ Test 2 Failed with wrong error:', error.message);
    }
  }

  console.log('--- Tests Complete ---');
  process.exit(0);
}

runTests();

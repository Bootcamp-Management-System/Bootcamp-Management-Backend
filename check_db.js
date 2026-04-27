import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bootcamp from './src/models/Bootcamp.js';
import Division from './src/models/Division.js';

// Load environment variables
dotenv.config({ path: 'src/config/.env' });

/**
 * DATABASE DIAGNOSTIC TOOL
 * Run: node check_db.js
 * Purpose: Verifies connection and provides a summary of system entities.
 */
const check = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bms_signup';
    console.log('📡 Attempting connection to MongoDB...');

    await mongoose.connect(mongoUri);
    console.log('✅ Connection Successful!');

    const bootcamps = await Bootcamp.find().populate('division');
    const divisions = await Division.find();

    console.log('\n================ SYSTEM STATUS REPORT ================');
    console.log(`📊 TOTAL DIVISIONS: ${divisions.length}`);
    divisions.forEach(d => console.log(`   [NODE] ${d.name}`));

    console.log(`\n🚀 TOTAL BOOTCAMPS: ${bootcamps.length}`);
    bootcamps.forEach(b => {
      console.log(`   [BOOTCAMP] ${b.name}`);
      console.log(`     - ID: ${b._id}`);
      console.log(`     - Division: ${b.division?.name || 'UNASSIGNED'}`);
      console.log(`     - Status: ${b.status}`);
      console.log(`     - Visibility: ${b.isPublished ? 'PUBLISHED' : 'DRAFT'}`);
      console.log('     -------------------------------------------');
    });
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Diagnostic failed. Ensure MongoDB is running and MONGO_URI is correct in .env');
    console.error(error.message);
    process.exit(1);
  }
};

check();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';

const realNames = [
  "Mohammed Ahmed", "Biruk Tesfaye", "Amina Hussein", "Dawit Kebede", 
  "Sara Tadesse", "Yonas Alemu", "Fatima Ali", "Eyob Mekonnen", 
  "Betelhem Assefa", "Natnael Getachew", "Hanna Girma", "Samuel Bekele",
  "Kalkidan Worku", "Ephrem Tilahun", "Meron Haile", "Biniam Desta",
  "Helen Abebe", "Abel Zewdu", "Tigist Fikre", "Elias Demissie",
  "Bereket Wondimu", "Makda Endale", "Kidus Solomon", "Lidia Tadesse",
  "Fikre Yohannes"
];

import Division from '../models/Division.js';

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');

    // Fetch existing divisions
    const divisions = await Division.find({});
    if (divisions.length === 0) {
      console.warn('⚠️ No divisions found in the database. Users will be created without a division.');
    } else {
      console.log(`✅ Found ${divisions.length} divisions.`);
    }

    const hashedPassword = await bcrypt.hash('12345678', 10);
    const usersToInsert = [];

    for (let i = 0; i < 100; i++) {
      const baseName = realNames[i % realNames.length];
      const suffix = i >= realNames.length ? ` ${Math.floor(i / realNames.length) + 1}` : '';
      const fullName = `${baseName}${suffix}`;
      const emailPrefix = baseName.split(' ')[0].toLowerCase();
      const email = `${emailPrefix}${i + 1}@bootcamp.local`;

      // Assign to a division evenly
      const assignedDivision = divisions.length > 0 ? divisions[i % divisions.length]._id : null;

      usersToInsert.push({
        name: fullName,
        email: email,
        password: hashedPassword,
        role: 'student',
        division: assignedDivision, // Assign to division
        verified: true, // Make them verified so they can be promoted
        is_Member: true, // Mark them as members
        firstLogin: false,
      });
    }

    // Clear existing dummy users if any, based on email domain
    await User.deleteMany({ email: { $regex: '@bootcamp\\.local$' } });
    
    await User.insertMany(usersToInsert);
    console.log('✅ 100 users seeded successfully, distributed across divisions!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bootcamp');
    console.log('MongoDB Connected');
    
    // Using dynamic import since User.js is a module
    const User = (await import('./src/models/User.js')).default;
    
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.findOne({ role: 'super-admin' });
    }
    
    if (admin) {
      console.log('Found admin:', admin.email);
      // reset password to password123
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash('password123', salt);
      await admin.save();
      console.log('Password reset to password123');
    } else {
      console.log('No admin found');
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
connectDB();

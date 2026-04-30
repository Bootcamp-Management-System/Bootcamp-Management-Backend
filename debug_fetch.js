import mongoose from 'mongoose';
import Application from './src/models/Application.js';
import User from './src/models/User.js';
import Bootcamp from './src/models/Bootcamp.js';
import Division from './src/models/Division.js';
import dotenv from 'dotenv';

dotenv.config({ path: 'src/config/.env' });

async function debugFetch() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find a student
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('No student found');
      process.exit(0);
    }
    console.log('Testing with student:', student.email, student._id);

    const filter = { student: student._id };
    console.log('Filter:', filter);

    const query = Application.find(filter)
      .populate('student', 'email name')
      .populate('bootcamp', 'name division')
      .sort('-createdAt');

    const results = await query;
    console.log('Results count:', results.length);
    
    process.exit(0);
  } catch (err) {
    console.error('FETCH ERROR:', err);
    process.exit(1);
  }
}

debugFetch();

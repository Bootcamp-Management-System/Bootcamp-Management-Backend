import mongoose from 'mongoose';
import Bootcamp from './src/models/Bootcamp.js';
import Application from './src/models/Application.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDb() {
  await mongoose.connect(process.env.MONGODB_URI);

  const bootcamps = await Bootcamp.find();
  const applications = await Application.find();
  const users = await User.find();

  console.log('--- DATABASE STATUS ---');
  console.log('Bootcamps:', bootcamps.length);
  bootcamps.forEach(b => console.log(` - ${b.name} (Published: ${b.isPublished})`));

  console.log('Applications:', applications.length);
  applications.forEach(a => console.log(` - Student: ${a.student}, Bootcamp: ${a.bootcamp}, Status: ${a.status}`));

  console.log('Users:', users.length);
  users.forEach(u => console.log(` - ${u.email} (Role: ${u.role})`));

  await mongoose.disconnect();
}

checkDb();

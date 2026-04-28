import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const User = (await import('./src/models/User.js')).default;
const Division = (await import('./src/models/Division.js')).default;

try {
  await mongoose.connect(process.env.MONGO_URI);
  const div = await Division.findOne({ name: 'Development' });
  console.log('Development division id =', div?._id?.toString());
  const users = await User.find({ division: div?._id }).limit(5)
    .populate('division', 'name')
    .populate('memberships.division', 'name');
  console.log('Sample users:', users.map(u => ({
    email: u.email,
    role: u.role,
    division: u.division?.name,
    memberships: u.memberships.map(m => ({ division: m.division?.name, isMember: m.isMember }))
  })));
} catch (err) {
  console.error(err);
} finally {
  await mongoose.disconnect();
}
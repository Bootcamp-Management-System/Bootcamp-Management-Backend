import mongoose from 'mongoose';

(async () => {
  await mongoose.connect('mongodb://localhost:27017/bootcamp-db');
  const Division = mongoose.model('Division', new mongoose.Schema({ name: String, description: String }));
  const divs = await Division.find({});
  if (divs.length === 0) {
    const defaultDivs = [
      { name: 'Development', description: 'Master modern full-stack development' },
      { name: 'CPD', description: 'Competitive Programming' },
      { name: 'Cyber Security', description: 'Offensive security and network defense' },
      { name: 'Data Science', description: 'Machine learning and artificial intelligence' }
    ];
    await Division.insertMany(defaultDivs);
    console.log('Seeded 4 divisions');
  } else {
    console.log('Found divisions:', divs.map(d => d.name));
  }
  process.exit(0);
})();

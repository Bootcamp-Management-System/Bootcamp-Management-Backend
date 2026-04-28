/**
 * seed_members.js
 * ---------------
 * Creates 4 CSEC divisions + 100 member-role users.
 * All users have password: 12345678
 *
 * Run:  node seed_members.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

// ── Models ────────────────────────────────────────────────────────────────────

const divisionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: String,
    instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['super-admin', 'admin', 'instructor', 'student'], required: true },
    memberships: [
      {
        division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
        isMember: { type: Boolean, default: false },
        isInstructor: { type: Boolean, default: false },
        isMentoring: { type: Boolean, default: false },
      },
    ],
    is_Member: { type: Boolean, default: false },
    is_Mentoring: { type: Boolean, default: false },
    division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
    assignedDivisions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Division' }],
    is_EmailVerified: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    firstLogin: { type: Boolean, default: false },
    verified: { type: Boolean, default: true },
    googleId: String,
    otp: { code: String, expiresAt: Date },
    resetOTP: { code: String, expiresAt: Date },
  },
  { timestamps: true }
);

const Division = mongoose.models.Division || mongoose.model('Division', divisionSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

// ── Division data ─────────────────────────────────────────────────────────────

const DIVISIONS = [
  { name: 'Development', description: 'Software development, web & mobile engineering bootcamp.' },
  { name: 'Data Science', description: 'Machine learning, data analysis, and AI bootcamp.' },
  { name: 'Cyber Security', description: 'Ethical hacking, network security, and CTF bootcamp.' },
  { name: 'CPD', description: 'Competitive Programming & problem-solving bootcamp.' },
];

// ── 100 Member names & emails ─────────────────────────────────────────────────

const MEMBERS = [
  // Development (25)
  { name: 'Mohammed Ali',        email: 'mohammed.ali@csec.astu.edu.et' },
  { name: 'Fatuma Ahmed',        email: 'fatuma.ahmed@csec.astu.edu.et' },
  { name: 'Sara Ibrahim',        email: 'sara.ibrahim@csec.astu.edu.et' },
  { name: 'Yusuf Hassan',        email: 'yusuf.hassan@csec.astu.edu.et' },
  { name: 'Amina Noor',          email: 'amina.noor@csec.astu.edu.et' },
  { name: 'Omar Farouk',         email: 'omar.farouk@csec.astu.edu.et' },
  { name: 'Zahra Saleh',         email: 'zahra.saleh@csec.astu.edu.et' },
  { name: 'Abdi Warsame',        email: 'abdi.warsame@csec.astu.edu.et' },
  { name: 'Hodan Abdi',          email: 'hodan.abdi@csec.astu.edu.et' },
  { name: 'Bilal Idris',         email: 'bilal.idris@csec.astu.edu.et' },
  { name: 'Faisal Mohammed',     email: 'faisal.mohammed@csec.astu.edu.et' },
  { name: 'Nimo Osman',          email: 'nimo.osman@csec.astu.edu.et' },
  { name: 'Hasan Yusuf',         email: 'hasan.yusuf@csec.astu.edu.et' },
  { name: 'Ruqiya Aden',         email: 'ruqiya.aden@csec.astu.edu.et' },
  { name: 'Khalid Mukhtar',      email: 'khalid.mukhtar@csec.astu.edu.et' },
  { name: 'Ifrah Ahmed',         email: 'ifrah.ahmed@csec.astu.edu.et' },
  { name: 'Mahad Ibrahim',       email: 'mahad.ibrahim@csec.astu.edu.et' },
  { name: 'Safia Abdi',          email: 'safia.abdi@csec.astu.edu.et' },
  { name: 'Abdullahi Omar',      email: 'abdullahi.omar@csec.astu.edu.et' },
  { name: 'Hibo Hassan',         email: 'hibo.hassan@csec.astu.edu.et' },
  { name: 'Isse Mohamed',        email: 'isse.mohamed@csec.astu.edu.et' },
  { name: 'Deeqa Farah',         email: 'deeqa.farah@csec.astu.edu.et' },
  { name: 'Suleiman Ali',        email: 'suleiman.ali@csec.astu.edu.et' },
  { name: 'Ladan Warsame',       email: 'ladan.warsame@csec.astu.edu.et' },
  { name: 'Nasib Mumin',         email: 'nasib.mumin@csec.astu.edu.et' },

  // Data Science (25)
  { name: 'Abebe Kebede',        email: 'abebe.kebede@csec.astu.edu.et' },
  { name: 'Tigist Alemu',        email: 'tigist.alemu@csec.astu.edu.et' },
  { name: 'Bekele Tadesse',      email: 'bekele.tadesse@csec.astu.edu.et' },
  { name: 'Hiwot Girma',         email: 'hiwot.girma@csec.astu.edu.et' },
  { name: 'Dawit Tesfaye',       email: 'dawit.tesfaye@csec.astu.edu.et' },
  { name: 'Selamawit Hailu',     email: 'selamawit.hailu@csec.astu.edu.et' },
  { name: 'Yonas Gebre',         email: 'yonas.gebre@csec.astu.edu.et' },
  { name: 'Meron Desta',         email: 'meron.desta@csec.astu.edu.et' },
  { name: 'Biruk Assefa',        email: 'biruk.assefa@csec.astu.edu.et' },
  { name: 'Liya Solomon',        email: 'liya.solomon@csec.astu.edu.et' },
  { name: 'Kedir Hussain',       email: 'kedir.hussain@csec.astu.edu.et' },
  { name: 'Eden Haile',          email: 'eden.haile@csec.astu.edu.et' },
  { name: 'Temesgen Worku',      email: 'temesgen.worku@csec.astu.edu.et' },
  { name: 'Selam Bekele',        email: 'selam.bekele@csec.astu.edu.et' },
  { name: 'Abel Tarekegn',       email: 'abel.tarekegn@csec.astu.edu.et' },
  { name: 'Hana Tekle',          email: 'hana.tekle@csec.astu.edu.et' },
  { name: 'Natnael Girma',       email: 'natnael.girma@csec.astu.edu.et' },
  { name: 'Firehiwot Alemu',     email: 'firehiwot.alemu@csec.astu.edu.et' },
  { name: 'Benyam Tadesse',      email: 'benyam.tadesse@csec.astu.edu.et' },
  { name: 'Tsion Mengistu',      email: 'tsion.mengistu@csec.astu.edu.et' },
  { name: 'Robel Tefera',        email: 'robel.tefera@csec.astu.edu.et' },
  { name: 'Wubet Zewdu',         email: 'wubet.zewdu@csec.astu.edu.et' },
  { name: 'Bethlehem Hailu',     email: 'bethlehem.hailu@csec.astu.edu.et' },
  { name: 'Henok Tesfaw',        email: 'henok.tesfaw@csec.astu.edu.et' },
  { name: 'Mihret Aklilu',       email: 'mihret.aklilu@csec.astu.edu.et' },

  // Cybersecurity (25)
  { name: 'Kalid Omar',          email: 'kalid.omar@csec.astu.edu.et' },
  { name: 'Nura Mohammed',       email: 'nura.mohammed@csec.astu.edu.et' },
  { name: 'Siham Yimam',         email: 'siham.yimam@csec.astu.edu.et' },
  { name: 'Hamza Abdi',          email: 'hamza.abdi@csec.astu.edu.et' },
  { name: 'Zainab Kedir',        email: 'zainab.kedir@csec.astu.edu.et' },
  { name: 'Idris Hassan',        email: 'idris.hassan@csec.astu.edu.et' },
  { name: 'Asma Jemal',          email: 'asma.jemal@csec.astu.edu.et' },
  { name: 'Tariq Abdurahman',    email: 'tariq.abdurahman@csec.astu.edu.et' },
  { name: 'Lubna Usman',         email: 'lubna.usman@csec.astu.edu.et' },
  { name: 'Abubakar Muhammed',   email: 'abubakar.muhammed@csec.astu.edu.et' },
  { name: 'Maryan Hussein',      email: 'maryan.hussein@csec.astu.edu.et' },
  { name: 'Ridwan Bekele',       email: 'ridwan.bekele@csec.astu.edu.et' },
  { name: 'Naima Abdi',          email: 'naima.abdi@csec.astu.edu.et' },
  { name: 'Yasir Ahmed',         email: 'yasir.ahmed@csec.astu.edu.et' },
  { name: 'Firdaws Ibrahim',     email: 'firdaws.ibrahim@csec.astu.edu.et' },
  { name: 'Mukhtar Osman',       email: 'mukhtar.osman@csec.astu.edu.et' },
  { name: 'Hawa Farah',          email: 'hawa.farah@csec.astu.edu.et' },
  { name: 'Ismail Abdi',         email: 'ismail.abdi@csec.astu.edu.et' },
  { name: 'Rahma Salah',         email: 'rahma.salah@csec.astu.edu.et' },
  { name: 'Bashir Warsame',      email: 'bashir.warsame@csec.astu.edu.et' },
  { name: 'Suad Geedi',          email: 'suad.geedi@csec.astu.edu.et' },
  { name: 'Jamal Mohamoud',      email: 'jamal.mohamoud@csec.astu.edu.et' },
  { name: 'Fadumo Nur',          email: 'fadumo.nur@csec.astu.edu.et' },
  { name: 'Osman Abdullahi',     email: 'osman.abdullahi@csec.astu.edu.et' },
  { name: 'Wiilo Ahmed',         email: 'wiilo.ahmed@csec.astu.edu.et' },

  // CPD (25)
  { name: 'Nahom Alemu',         email: 'nahom.alemu@csec.astu.edu.et' },
  { name: 'Ruth Tesfaye',        email: 'ruth.tesfaye@csec.astu.edu.et' },
  { name: 'Samuel Girma',        email: 'samuel.girma@csec.astu.edu.et' },
  { name: 'Elsa Haile',          email: 'elsa.haile@csec.astu.edu.et' },
  { name: 'Daniel Mulugeta',     email: 'daniel.mulugeta@csec.astu.edu.et' },
  { name: 'Enat Kebede',         email: 'enat.kebede@csec.astu.edu.et' },
  { name: 'Mikias Bekele',       email: 'mikias.bekele@csec.astu.edu.et' },
  { name: 'Hiwot Tesfaw',        email: 'hiwot.tesfaw@csec.astu.edu.et' },
  { name: 'Yohannes Abera',      email: 'yohannes.abera@csec.astu.edu.et' },
  { name: 'Almaz Demeke',        email: 'almaz.demeke@csec.astu.edu.et' },
  { name: 'Tewodros Hailu',      email: 'tewodros.hailu@csec.astu.edu.et' },
  { name: 'Azeb Wolde',          email: 'azeb.wolde@csec.astu.edu.et' },
  { name: 'Surafel Tekle',       email: 'surafel.tekle@csec.astu.edu.et' },
  { name: 'Tigist Mengistu',     email: 'tigist.mengistu@csec.astu.edu.et' },
  { name: 'Mekonnen Tadesse',    email: 'mekonnen.tadesse@csec.astu.edu.et' },
  { name: 'Yeshi Girma',         email: 'yeshi.girma@csec.astu.edu.et' },
  { name: 'Habtamu Alemu',       email: 'habtamu.alemu@csec.astu.edu.et' },
  { name: 'Meseret Bekele',      email: 'meseret.bekele@csec.astu.edu.et' },
  { name: 'Girma Teferra',       email: 'girma.teferra@csec.astu.edu.et' },
  { name: 'Fekadu Wolde',        email: 'fekadu.wolde@csec.astu.edu.et' },
  { name: 'Tigist Desta',        email: 'tigist.desta@csec.astu.edu.et' },
  { name: 'Birhane Tesfaw',      email: 'birhane.tesfaw@csec.astu.edu.et' },
  { name: 'Yordanos Haile',      email: 'yordanos.haile@csec.astu.edu.et' },
  { name: 'Ermias Asfaw',        email: 'ermias.asfaw@csec.astu.edu.et' },
  { name: 'Zewditu Demeke',      email: 'zewditu.demeke@csec.astu.edu.et' },
];

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  const hashedPassword = await bcrypt.hash('12345678', 10);

  // 1. Upsert the 4 divisions
  console.log('📂 Upserting divisions...');
  const divisionDocs = [];
  for (const div of DIVISIONS) {
    const doc = await Division.findOneAndUpdate(
      { name: div.name },
      { $set: div },
      { upsert: true, new: true }
    );
    divisionDocs.push(doc);
    console.log(`   ✔ Division: ${doc.name} (${doc._id})`);
  }

  // Map division name → ObjectId
  const divMap = {};
  for (const d of divisionDocs) divMap[d.name] = d._id;

  const divisionNames = ['Development', 'Data Science', 'Cyber Security', 'CPD'];

  // 2. Insert 100 members (25 per division, round-robin)
  console.log('\n👥 Seeding 100 members...');
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < MEMBERS.length; i++) {
    const { name, email } = MEMBERS[i];
    const divName = divisionNames[Math.floor(i / 25)]; // 25 per division
    const divId = divMap[divName];

    const exists = await User.findOne({ email });
    if (exists) {
      console.log(`   ⚠ Skipped (already exists): ${email}`);
      skipped++;
      continue;
    }

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'student',         // base role — Super Admin promotes to admin, admin promotes to instructor
      is_Member: true,
      is_EmailVerified: true,
      verified: true,
      firstLogin: false,
      division: divId,
      assignedDivisions: [divId],
      memberships: [
        {
          division: divId,
          isMember: true,
          isInstructor: false,
          isMentoring: false,
        },
      ],
    });

    created++;
    console.log(`   ✔ [${divName}] ${name} <${email}>`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Done! Created: ${created} | Skipped: ${skipped}`);
  console.log('🔑 Default password for all members: 12345678');
  console.log('\nDivision → Member mapping:');
  divisionNames.forEach((name, i) => {
    const start = i * 25 + 1;
    const end = start + 24;
    console.log(`   ${name.padEnd(14)} → Members ${start}–${end}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});

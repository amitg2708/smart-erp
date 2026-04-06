/**
 * Smart College ERP — Database Seeder
 * =====================================
 * Generates realistic Indian dummy data:
 *   - 1 Admin
 *   - 10 Faculty
 *   - 50 Students (with profiles, 3-5 subjects each, results, and fee records)
 *
 * Usage: node backend/seed.js
 * Password for all users: 123456
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Student = require('./models/Student');
const Result = require('./models/Result');
const Fee = require('./models/Fee');

// ─── Indian Name Data ──────────────────────────────────────────────────────────
const MALE_NAMES = [
  'Aarav', 'Arjun', 'Rohan', 'Vikram', 'Amit', 'Rahul', 'Karan', 'Suraj', 'Nikhil', 'Deepak',
  'Harsh', 'Yash', 'Ravi', 'Sanjay', 'Ajay', 'Dev', 'Manish', 'Ankit', 'Prateek', 'Gaurav',
  'Shubham', 'Vishal', 'Sachin', 'Mohit', 'Piyush', 'Akash', 'Aditya', 'Varun', 'Sumit', 'Tushar'
];

const FEMALE_NAMES = [
  'Priya', 'Anjali', 'Pooja', 'Neha', 'Sneha', 'Kavya', 'Divya', 'Riya', 'Shruti', 'Ananya',
  'Meera', 'Swati', 'Nisha', 'Sapna', 'Rekha', 'Sunita', 'Geeta', 'Mamta', 'Komal', 'Pallavi'
];

const SURNAMES = [
  'Sharma', 'Verma', 'Singh', 'Gupta', 'Kumar', 'Patel', 'Shah', 'Mehta', 'Joshi', 'Yadav',
  'Mishra', 'Tiwari', 'Pandey', 'Chauhan', 'Rao', 'Reddy', 'Iyer', 'Nair', 'Pillai', 'Das',
  'Bose', 'Sen', 'Ghosh', 'Roy', 'Chakraborty', 'Agarwal', 'Jain', 'Malhotra', 'Kapoor', 'Saxena'
];

const FACULTY_TITLES = ['Dr.', 'Prof.', 'Mr.', 'Ms.'];

const COURSES = [
  { name: 'B.Tech CSE', branch: 'Computer Science' },
  { name: 'B.Tech ECE', branch: 'Electronics & Communication' },
  { name: 'B.Tech ME', branch: 'Mechanical Engineering' },
  { name: 'B.Tech CE', branch: 'Civil Engineering' },
  { name: 'BCA', branch: 'Computer Applications' },
  { name: 'MCA', branch: 'Computer Applications' },
  { name: 'MBA', branch: 'Business Administration' },
  { name: 'B.Com', branch: 'Commerce' },
  { name: 'B.Sc IT', branch: 'Information Technology' },
  { name: 'M.Tech CSE', branch: 'Computer Science' },
];

const SUBJECTS_BY_COURSE = {
  'B.Tech CSE': ['Data Structures', 'Algorithms', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering', 'Machine Learning', 'Web Technology'],
  'B.Tech ECE': ['Digital Electronics', 'Analog Circuits', 'Signals & Systems', 'Microprocessors', 'Communication Systems', 'VLSI Design'],
  'B.Tech ME': ['Engineering Mechanics', 'Thermodynamics', 'Fluid Mechanics', 'Manufacturing Process', 'Machine Design'],
  'B.Tech CE': ['Structural Analysis', 'Concrete Technology', 'Fluid Mechanics', 'Geotechnical Engineering', 'Transportation Engineering'],
  'BCA': ['Programming in C', 'Data Structures', 'DBMS', 'Web Development', 'Software Engineering', 'Networking'],
  'MCA': ['Advanced Algorithms', 'Software Testing', 'Cloud Computing', 'Machine Learning', 'Distributed Systems'],
  'MBA': ['Financial Management', 'Marketing Management', 'HRM', 'Business Ethics', 'Operations Management'],
  'B.Com': ['Financial Accounting', 'Business Law', 'Economics', 'Taxation', 'Cost Accounting'],
  'B.Sc IT': ['Programming Fundamentals', 'Web Technology', 'DBMS', 'Networking', 'Mobile Computing'],
  'M.Tech CSE': ['Advanced Data Structures', 'Compiler Design', 'Distributed Computing', 'Research Methodology', 'AI & ML'],
};

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];
const STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh'];

// ─── Utility Functions ─────────────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generatePhone = () => {
  const prefixes = ['70', '80', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'];
  return pick(prefixes) + String(rand(10000000, 99999999));
};

const generateAddress = () => {
  const city = pick(CITIES);
  const state = STATES[CITIES.indexOf(city)] || pick(STATES);
  return `${rand(1, 999)}, ${pick(['Main Road', 'Gandhi Nagar', 'MG Road', 'Shivaji Marg', 'Nehru Street'])}, ${city}, ${state}`;
};

const generateName = (gender = null) => {
  const isMale = gender === 'male' || (gender === null && Math.random() > 0.45);
  const first = pick(isMale ? MALE_NAMES : FEMALE_NAMES);
  const last = pick(SURNAMES);
  return `${first} ${last}`;
};

const generateEmail = (name, counter, domain = 'college.edu') => {
  const base = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
  return `${base}.${counter}@${domain}`;
};

const generateMarks = (min, max) => rand(min, max);

// ─── Seeder Main Function ───────────────────────────────────────────────────────
const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('\n🔌 Connected to MongoDB...');

  // Clear existing seeded data (but keep manually created data with different emails)
  console.log('\n🗑️  Clearing existing seeded data...');
  await User.deleteMany({ email: { $regex: /@college\.edu$/ } });
  const usersDeleted = await User.deleteMany({ email: { $regex: /@faculty\.edu$/ } });
  await Student.deleteMany({});
  await Result.deleteMany({});
  await Fee.deleteMany({});
  console.log('   Cleared users, students, results, and fees.');

  // Hash password once (used for all users)
  const hashedPassword = await bcrypt.hash('123456', 10);

  const allUsers = [];
  const allStudents = [];

  // ─── 1. Create Admin ─────────────────────────────────────────────────────────
  console.log('\n👑 Creating Admin...');
  const admin = await User.create({
    name: 'Rajesh Kumar Mishra',
    email: 'admin@college.edu',
    password: hashedPassword,
    role: 'admin',
    phone: '9876543210',
    isActive: true,
    emailVerified: true,
  });
  allUsers.push(admin);
  console.log(`   ✅ Admin: ${admin.name} (${admin.email})`);

  // ─── 2. Create 10 Faculty ────────────────────────────────────────────────────
  console.log('\n👨‍🏫 Creating Faculty...');
  const facultyData = [
    { name: 'Dr. Anita Sharma', dept: 'Computer Science' },
    { name: 'Prof. Suresh Verma', dept: 'Electronics' },
    { name: 'Dr. Kavitha Nair', dept: 'Mathematics' },
    { name: 'Prof. Ramesh Tiwari', dept: 'Physics' },
    { name: 'Dr. Meenakshi Iyer', dept: 'Computer Science' },
    { name: 'Mr. Arun Patel', dept: 'Mechanical' },
    { name: 'Ms. Sunita Yadav', dept: 'Civil' },
    { name: 'Dr. Vikash Singh', dept: 'Computer Science' },
    { name: 'Prof. Lakshmi Reddy', dept: 'Management' },
    { name: 'Dr. Pradeep Joshi', dept: 'Electronics' },
  ];

  const facultyUsers = [];
  for (let i = 0; i < facultyData.length; i++) {
    const fd = facultyData[i];
    const email = `faculty${i + 1}@college.edu`;
    const faculty = await User.create({
      name: fd.name,
      email,
      password: hashedPassword,
      role: 'faculty',
      phone: generatePhone(),
      isActive: true,
      emailVerified: true,
    });
    facultyUsers.push(faculty);
    allUsers.push(faculty);
    console.log(`   ✅ ${faculty.name} (${email})`);
  }

  // ─── 3. Create 50 Students ───────────────────────────────────────────────────
  console.log('\n🎓 Creating 50 Students...');
  const studentCount = 50;
  const emailTracker = new Set();
  const rollTracker = new Set();

  for (let i = 0; i < studentCount; i++) {
    const gender = Math.random() > 0.45 ? 'male' : 'female';
    const name = generateName(gender);
    const course = pick(COURSES);
    const year = rand(1, 4);
    const semester = year * 2 - (Math.random() > 0.5 ? 0 : 1); // Current or previous sem

    // Generate unique email
    let email, emailCounter = i + 1;
    do {
      email = generateEmail(name, emailCounter);
      emailCounter++;
    } while (emailTracker.has(email));
    emailTracker.add(email);

    // Generate unique roll number
    let rollNumber;
    const yearCode = 2021 + (4 - year);
    const courseCode = course.name.replace(/[^A-Z]/g, '').substring(0, 3);
    do {
      rollNumber = `${courseCode}${yearCode}${String(rand(1, 999)).padStart(3, '0')}`;
    } while (rollTracker.has(rollNumber));
    rollTracker.add(rollNumber);

    // Create User
    const studentUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'student',
      phone: generatePhone(),
      isActive: true,
      emailVerified: true,
    });
    allUsers.push(studentUser);

    // Create Student Profile
    const student = await Student.create({
      userId: studentUser._id,
      rollNumber,
      course: course.name,
      year,
      branch: course.branch,
      phone: generatePhone(),
      address: generateAddress(),
    });
    allStudents.push({ student, user: studentUser, course: course.name, year, semester });

    process.stdout.write(`\r   Creating students: ${i + 1}/${studentCount}`);
  }
  console.log(`\n   ✅ Created ${studentCount} students.`);

  // ─── 4. Create Results for each Student ─────────────────────────────────────
  console.log('\n📊 Creating Results...');
  let totalResults = 0;

  for (const { student, course, semester } of allStudents) {
    const subjectPool = SUBJECTS_BY_COURSE[course] || SUBJECTS_BY_COURSE['B.Tech CSE'];
    const subjectCount = rand(3, Math.min(5, subjectPool.length));
    const selectedSubjects = [...subjectPool].sort(() => Math.random() - 0.5).slice(0, subjectCount);
    const addedBy = pick(facultyUsers)._id;

    for (const subject of selectedSubjects) {
      // Generate realistic marks (not too low or too high)
      const assignmentMarks = generateMarks(12, 28);
      const testMarks = generateMarks(14, 28);
      const projectMarks = generateMarks(18, 38);
      const total = assignmentMarks + testMarks + projectMarks;

      await Result.create({
        studentId: student._id,
        subject,
        semester,
        assignmentMarks,
        testMarks,
        projectMarks,
        total,
        addedBy,
      });
      totalResults++;
    }
  }
  console.log(`   ✅ Created ${totalResults} result records.`);

  // ─── 5. Create Fee Records ───────────────────────────────────────────────────
  console.log('\n💰 Creating Fee Records...');

  const FEE_STRUCTURES = {
    'B.Tech CSE': { base: 85000, label: 'Tuition + Lab Fee + Development Fee' },
    'B.Tech ECE': { base: 80000, label: 'Tuition + Lab Fee + Development Fee' },
    'B.Tech ME': { base: 75000, label: 'Tuition + Lab Fee + Development Fee' },
    'B.Tech CE': { base: 72000, label: 'Tuition + Lab Fee + Development Fee' },
    'BCA': { base: 45000, label: 'Tuition + Lab Fee' },
    'MCA': { base: 60000, label: 'Tuition + Lab Fee' },
    'MBA': { base: 95000, label: 'Tuition + Activity Fee' },
    'B.Com': { base: 35000, label: 'Tuition Fee' },
    'B.Sc IT': { base: 50000, label: 'Tuition + Lab Fee' },
    'M.Tech CSE': { base: 70000, label: 'Tuition + Research Fee' },
  };

  let totalFeeRecords = 0;
  const feeStatuses = ['paid', 'paid', 'partial', 'partial', 'pending', 'overdue']; // Distribution

  for (const { student, course, semester } of allStudents) {
    const feeStruct = FEE_STRUCTURES[course] || { base: 60000, label: 'Tuition Fee' };
    const variation = rand(-5000, 10000);
    const totalFees = feeStruct.base + variation;
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() - rand(0, 3));

    const status = pick(feeStatuses);
    let paidAmount = 0;
    let lateFee = 0;
    const paymentHistory = [];

    if (status === 'paid') {
      paidAmount = totalFees;
      const payDate = new Date(dueDate);
      payDate.setDate(payDate.getDate() - rand(1, 15));
      paymentHistory.push({
        amount: totalFees,
        paidDate: payDate,
        method: pick(['cash', 'online', 'cheque', 'dd']),
        note: 'Full payment',
        receiptNo: `RCPT${String(rand(10000, 99999))}`,
      });
    } else if (status === 'partial') {
      const partialPct = rand(30, 70) / 100;
      paidAmount = Math.round(totalFees * partialPct);
      const payDate = new Date(dueDate);
      payDate.setDate(payDate.getDate() - rand(1, 30));
      paymentHistory.push({
        amount: paidAmount,
        paidDate: payDate,
        method: pick(['cash', 'online']),
        note: 'Partial payment',
        receiptNo: `RCPT${String(rand(10000, 99999))}`,
      });
    } else if (status === 'overdue') {
      paidAmount = 0;
      const daysOverdue = rand(5, 45);
      lateFee = Math.min(daysOverdue * 10, totalFees * 0.1);
    }
    // pending: paidAmount stays 0

    const pendingAmount = totalFees + lateFee - paidAmount;

    // Installment plan for large fees
    const installments = [];
    if (totalFees > 70000 && status !== 'paid') {
      const installmentCount = 3;
      const installmentAmount = Math.round(totalFees / installmentCount);
      for (let k = 0; k < installmentCount; k++) {
        const instDate = new Date(dueDate);
        instDate.setMonth(instDate.getMonth() + k);
        installments.push({
          dueDate: instDate,
          amount: k === installmentCount - 1 ? totalFees - installmentAmount * (installmentCount - 1) : installmentAmount,
          paidAmount: k === 0 && paidAmount > 0 ? Math.min(paidAmount, installmentAmount) : 0,
          status: k === 0 && paidAmount > 0 ? 'paid' : 'pending',
        });
      }
    }

    await Fee.create({
      studentId: student._id,
      semester,
      totalFees,
      paidAmount,
      pendingAmount,
      lateFee,
      status,
      dueDate,
      description: feeStruct.label,
      paymentHistory,
      installments,
    });
    totalFeeRecords++;
  }

  console.log(`   ✅ Created ${totalFeeRecords} fee records.`);

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
  console.log('═'.repeat(60));
  console.log('\n📋 Summary:');
  console.log(`   👑 Admin      : 1`);
  console.log(`   👨‍🏫 Faculty    : ${facultyData.length}`);
  console.log(`   🎓 Students   : ${studentCount}`);
  console.log(`   📊 Results    : ${totalResults}`);
  console.log(`   💰 Fees       : ${totalFeeRecords}`);
  console.log('\n🔑 Login Credentials (Password for all: 123456)');
  console.log('─'.repeat(60));
  console.log(`   Admin   → admin@college.edu`);
  console.log(`   Faculty → faculty1@college.edu to faculty10@college.edu`);
  console.log(`   Student → (check DB for generated emails)`);
  console.log('\n📚 API Docs: http://localhost:5000/api/docs');
  console.log('═'.repeat(60) + '\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('\n❌ Seeding failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});

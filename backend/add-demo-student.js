const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hashedPassword = await bcrypt.hash('123456', 10);
  const user = await User.findOneAndUpdate(
    { email: 'demo.student@college.edu' },
    { $set: { name: 'Demo Student', password: hashedPassword, role: 'student', isActive: true, emailVerified: true } },
    { upsert: true, new: true }
  );
  
  const Student = require('./models/Student');
  await Student.updateOne(
    { userId: user._id },
    { $set: { rollNumber: 'DEMO001', course: 'B.Tech CSE', year: 1, branch: 'Computer Science', phone: '9000000000', address: 'Demo City' } },
    { upsert: true }
  );

  console.log('Created demo.student@college.edu and their student profile');
  process.exit(0);
}).catch(console.error);

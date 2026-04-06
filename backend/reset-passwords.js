const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hash = await bcrypt.hash('123456', 10);
  
  // Fix double hashed passwords for all seeded accounts by bypassing pre-save hook
  await User.updateMany(
    { email: { $regex: /@college\.edu$/ } },
    { $set: { password: hash } }
  );

  console.log('Fixed passwords for all Admin and Faculty demo accounts!');
  process.exit(0);
}).catch(console.error);

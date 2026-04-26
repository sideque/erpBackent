const mongoose = require('mongoose');
const { User } = require('./modules/users/user.model');

async function seed() {
  await mongoose.connect('mongodb://127.0.0.1:27017/vantus_erp');
  
  const hash = await User.hashPassword('admin123');
  
  await User.create({
    name: 'Super Admin',
    email: 'admin@vantus.com',
    passwordHash: hash,
    role: 'SUPER_ADMIN',
    status: 'ENABLED'
  });

  console.log('✅ User created!');
  process.exit(0);
}

seed();
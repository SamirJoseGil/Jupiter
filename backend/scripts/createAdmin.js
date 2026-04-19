const User = require('../models/user');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    const email = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@jupiter.test';
    const password = process.env.ADMIN_PASSWORD || process.argv[3] || 'Admin123456';
    const department = process.env.ADMIN_DEPARTMENT || process.argv[4] || 'Infraestructura';

    const adminUser = await User.create(email, password, department);
    
    console.log('Admin user created successfully:');
    console.log('Email:', adminUser.email);
    console.log('Department:', adminUser.department);
    console.log('\nCredentials used:');
    console.log('Email:', email);
    console.log('Password:', password);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();

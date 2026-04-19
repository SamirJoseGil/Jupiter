const pool = require('../config/database');
const User = require('../models/user');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    const adminUser = await User.create(
      'admin@jupiter.test',
      'Admin123456',
      'Infraestructura'
    );
    
    console.log('Admin user created successfully:');
    console.log('Email:', adminUser.email);
    console.log('Department:', adminUser.department);
    console.log('\nCredenciales de prueba:');
    console.log('Email: admin@jupiter.test');
    console.log('Password: Admin123456');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();

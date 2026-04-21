const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testDatabase() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  const prisma = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
    log: ['error', 'warn'],
  });

  try {
    console.log('📡 Attempting to connect...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    console.log('📊 Testing basic query...');
    const userCount = await prisma.user.count();
    console.log(`👥 User count: ${userCount}`);
    
    console.log('🎉 Database is working correctly!');
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check if your DATABASE_URL is correct');
      console.log('2. Verify your Prisma Accelerate connection is active');
      console.log('3. Make sure your database is accessible from your network');
    }
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testDatabase();
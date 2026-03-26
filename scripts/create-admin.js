const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

async function createAdmin() {
  try {
    const adminData = {
      firstName: 'Super',
      lastName: 'Admin',
      address: '0x9ed422636822d4db66c26acd856bf0ce25ae6fa5',
      superAdmin: true
    };

    const normalizedAddress = adminData.address.toLowerCase();

    console.log('Creating super admin user with address:', adminData.address);

    // Create/update in Admin table
    const admin = await prisma.admin.upsert({
      where: { address: normalizedAddress },
      update: {
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        superAdmin: adminData.superAdmin,
        updatedAt: new Date(),
      },
      create: {
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        address: normalizedAddress,
        superAdmin: adminData.superAdmin,
      },
    });

    console.log('✅ Admin record created/updated successfully:');
    console.log({
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      address: admin.address,
      superAdmin: admin.superAdmin,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    });

    // Also create/update in User table for compatibility
    const adminUser = await prisma.user.upsert({
      where: { walletAddress: normalizedAddress },
      update: {
        isAdmin: true,
        status: 'Active',
        lastActivity: new Date(),
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        fullName: `${adminData.firstName} ${adminData.lastName}`,
      },
      create: {
        userId: normalizedAddress,
        walletAddress: normalizedAddress,
        isAdmin: true,
        status: 'Active',
        joinDate: new Date(),
        lastActivity: new Date(),
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        fullName: `${adminData.firstName} ${adminData.lastName}`,
        username: 'superadmin',
        reputationScore: 1000,
        reputationTier: 'Excellent',
      },
    });

    console.log('✅ User record created/updated successfully:');
    console.log({
      id: adminUser.id,
      userId: adminUser.userId,
      walletAddress: adminUser.walletAddress,
      isAdmin: adminUser.isAdmin,
      status: adminUser.status,
      fullName: adminUser.fullName,
    });

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
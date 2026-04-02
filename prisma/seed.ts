import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a sample admin user
  const admin = await prisma.admin.upsert({
    where: { address: '0x1234567890123456789012345678901234567890' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      address: '0x1234567890123456789012345678901234567890',
      superAdmin: true,
    },
  });

  console.log('✅ Created admin user:', admin);

  // Create a sample presale user
  const presaleUser = await prisma.presaleUser.upsert({
    where: { walletAddress: '0x9876543210987654321098765432109876543210' },
    update: {},
    create: {
      walletAddress: '0x9876543210987654321098765432109876543210',
      tokensPurchased: 1000,
      claimed: 0,
      unclaimed: 1000,
      amountSpent: 100,
      joinDate: new Date(),
      lastActivity: new Date(),
    },
  });

  console.log('✅ Created presale user:', presaleUser);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

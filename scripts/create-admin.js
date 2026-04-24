/**
 * Register a wallet address as an admin in the database.
 *
 * Usage:
 *   node scripts/create-admin.js <walletAddress> [firstName] [lastName] [--super]
 *
 * Examples:
 *   node scripts/create-admin.js 0xAbc...123
 *   node scripts/create-admin.js 0xAbc...123 John Doe
 *   node scripts/create-admin.js 0xAbc...123 John Doe --super
 */

require('dotenv').config();
const postgres = require('postgres');

const DIRECT_DATABASE_URL =
  process.env.DIRECT_DATABASE_URL ||
  'postgres://490f73d790bde6bc90d64743834599f59ec337bca3d5060a775007b1ce64a699:sk_o5jtaQcJ-poIipnIRvmR1@db.prisma.io:5432/postgres?sslmode=require';

const args = process.argv.slice(2);
const address = args[0];

if (!address || !address.startsWith('0x')) {
  console.error('Usage: node scripts/create-admin.js <walletAddress> [firstName] [lastName] [--super]');
  process.exit(1);
}

const firstName  = args[1] || 'Admin';
const lastName   = args[2] || 'User';
const superAdmin = args.includes('--super');
const normalized = address.toLowerCase();

console.log('\nRegistering admin:');
console.log('  address   :', normalized);
console.log('  name      :', firstName, lastName);
console.log('  superAdmin:', superAdmin);

async function main() {
  const sql = postgres(DIRECT_DATABASE_URL, { ssl: 'require' });

  try {
    const result = await sql`
      INSERT INTO "Admin" (id, "firstName", "lastName", address, "superAdmin", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${firstName}, ${lastName}, ${normalized}, ${superAdmin}, NOW(), NOW())
      ON CONFLICT (address) DO UPDATE
        SET "firstName"  = EXCLUDED."firstName",
            "lastName"   = EXCLUDED."lastName",
            "superAdmin" = EXCLUDED."superAdmin",
            "updatedAt"  = NOW()
      RETURNING id, address, "superAdmin", "createdAt"
    `;

    const row = result[0];
    console.log('\n✅ Admin registered:');
    console.log('  id        :', row.id);
    console.log('  address   :', row.address);
    console.log('  superAdmin:', row.superAdmin);
    console.log('  createdAt :', row.createdAt);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});

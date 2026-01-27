import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env from one level up (since we are in scripts/)
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  try {
    console.log('Attempting to connect with DIRECT_URL:', process.env.DIRECT_URL?.split('@')[1]); // Log only host part for safety
    // Try to count users, this will fail if table doesn't exist
    const count = await prisma.user.count();
    console.log(`Success! Found ${count} users. Table 'users' exists.`);

    // Also check organization table
    const orgCount = await prisma.organization.count();
    console.log(`Success! Found ${orgCount} organizations.`);
  } catch (e) {
    console.error('Error connecting or querying with DIRECT_URL:');
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

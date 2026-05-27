#!/usr/bin/env node
const { PrismaClient, UserRole } = require('@prisma/client');

const prisma = new PrismaClient();

async function promote(userId) {
  if (!userId || Number.isNaN(userId)) {
    console.error('Usage: node scripts/promote-to-doctor.js <userId>');
    process.exit(1);
  }

  const id = Number(userId);

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      console.error('User not found:', id);
      process.exit(1);
    }

    await prisma.user.update({ where: { id }, data: { role: UserRole.Doctor } });

    await prisma.doctor.upsert({
      where: { userId: id },
      update: {},
      create: { userId: id, licenceNumber: `PROMO-${Date.now()}` },
    });

    console.log(`Promoted user ${id} to Doctor.`);
  } catch (err) {
    console.error('Error promoting user:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

promote(process.argv[2]);

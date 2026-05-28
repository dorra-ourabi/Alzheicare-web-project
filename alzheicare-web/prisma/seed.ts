import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '../generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seed() {
  const passwordHash =  await bcrypt.hash('12345', 10);;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@alzheicare.local' },
    update: {
      username: 'admin',
      firstName: 'System',
      secondName: 'Admin',
      password: passwordHash,
      role: UserRole.Admin,
      isEmailVerified: true,
      deletedAt: null,
    },
    create: {
      username: 'admin',
      firstName: 'System',
      secondName: 'Admin',
      email: 'admin@alzheicare.local',
      password: passwordHash,
      role: UserRole.Admin,
      isEmailVerified: true,
    },
  });

  const doctorUsers = [
    {
      username: 'dr.smith',
      firstName: 'Anna',
      secondName: 'Smith',
      email: 'dr.smith@alzheicare.local',
      licenceNumber: 'DOC-1001',
      specialization: 'Neurology',
    },
    {
      username: 'dr.khan',
      firstName: 'Omar',
      secondName: 'Khan',
      email: 'dr.khan@alzheicare.local',
      licenceNumber: 'DOC-1002',
      specialization: 'Geriatrics',
    },
  ];

  const doctors = [] as { userId: number; doctorId: number }[];

  for (const doctor of doctorUsers) {
    const user = await prisma.user.upsert({
      where: { email: doctor.email },
      update: {
        username: doctor.username,
        firstName: doctor.firstName,
        secondName: doctor.secondName,
        password: passwordHash,
        role: UserRole.Doctor,
        isEmailVerified: true,
        deletedAt: null,
      },
      create: {
        username: doctor.username,
        firstName: doctor.firstName,
        secondName: doctor.secondName,
        email: doctor.email,
        password: passwordHash,
        role: UserRole.Doctor,
        isEmailVerified: true,
      },
    });

    const doctorProfile = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {
        licenceNumber: doctor.licenceNumber,
        specialization: doctor.specialization,
      },
      create: {
        userId: user.id,
        licenceNumber: doctor.licenceNumber,
        specialization: doctor.specialization,
      },
    });

    doctors.push({ userId: user.id, doctorId: doctorProfile.id });
  }

  const patientUsers = [
    {
      username: 'patient.lee',
      firstName: 'Maya',
      secondName: 'Lee',
      email: 'patient.lee@alzheicare.local',
      doctorIndex: 0,
      phoneNumber: '555-0101',
    },
    {
      username: 'patient.ng',
      firstName: 'Eli',
      secondName: 'Ng',
      email: 'patient.ng@alzheicare.local',
      doctorIndex: 1,
      phoneNumber: '555-0102',
    },
    {
      username: 'patient.ali',
      firstName: 'Sara',
      secondName: 'Ali',
      email: 'patient.ali@alzheicare.local',
      doctorIndex: 0,
      phoneNumber: '555-0103',
    },
  ];

  for (const patient of patientUsers) {
    const user = await prisma.user.upsert({
      where: { email: patient.email },
      update: {
        username: patient.username,
        firstName: patient.firstName,
        secondName: patient.secondName,
        password: passwordHash,
        role: UserRole.Patient,
        isEmailVerified: true,
        deletedAt: null,
      },
      create: {
        username: patient.username,
        firstName: patient.firstName,
        secondName: patient.secondName,
        email: patient.email,
        password: passwordHash,
        role: UserRole.Patient,
        isEmailVerified: true,
      },
    });

    await prisma.patient.upsert({
      where: { userId: user.id },
      update: {
        doctorId: doctors[patient.doctorIndex]?.doctorId,
        phoneNumber: patient.phoneNumber,
      },
      create: {
        userId: user.id,
        doctorId: doctors[patient.doctorIndex]?.doctorId,
        phoneNumber: patient.phoneNumber,
      },
    });
  }

  const invitePatientUser = await prisma.user.upsert({
    where: { email: 'patient.invite@alzheicare.local' },
    update: {
      username: 'patient.invite',
      firstName: 'Lina',
      secondName: 'Haddad',
      password: passwordHash,
      role: UserRole.Patient,
      isEmailVerified: true,
      deletedAt: null,
    },
    create: {
      username: 'patient.invite',
      firstName: 'Lina',
      secondName: 'Haddad',
      email: 'patient.invite@alzheicare.local',
      password: passwordHash,
      role: UserRole.Patient,
      isEmailVerified: true,
    },
  });

  const invitePatient = await prisma.patient.upsert({
    where: { userId: invitePatientUser.id },
    update: {
      doctorId: null,
      phoneNumber: '555-0110',
    },
    create: {
      userId: invitePatientUser.id,
      doctorId: null,
      phoneNumber: '555-0110',
    },
  });

  const inviteDoctorId = doctors[0]?.doctorId;
  if (inviteDoctorId) {
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        patientId: invitePatient.id,
        doctorId: inviteDoctorId,
        status: 'PENDING',
      },
    });

    if (!existingInvite) {
      await prisma.invitation.create({
        data: {
          patientId: invitePatient.id,
          doctorId: inviteDoctorId,
          message: 'Seeded invitation for websocket testing.',
        },
      });
    }
  }

  return { adminId: admin.id };
}

seed()
  .then(({ adminId }) => {
    console.log(`Seeded admin user id: ${adminId}`);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export class PrismaClient {
  $connect = jest.fn();
  $disconnect = jest.fn();
}

export const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
};

export const UserRole = {
  Patient: 'Patient',
  Doctor: 'Doctor',
  Admin: 'Admin',
};
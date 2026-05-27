import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client.js';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const Admin = () => Roles(UserRole.Admin);
export const Doctor = () => Roles(UserRole.Doctor);
export const Patient = () => Roles(UserRole.Patient);

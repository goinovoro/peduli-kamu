import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Batasi endpoint ke role tertentu. Contoh: @Roles('admin') */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

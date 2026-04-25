import { User } from '@prisma/client';

export class SignOutResult {
  user?: User;
  access_token?: string;
  message?: string;
}

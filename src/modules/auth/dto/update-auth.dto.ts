import { UserDocument } from 'src/modules/user/entities/user.entity';

export class SignOutResult {
  user?: UserDocument;
  access_token?: string;
  message?: string;
}

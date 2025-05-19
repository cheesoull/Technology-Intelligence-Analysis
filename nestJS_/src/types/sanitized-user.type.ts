import { User } from '../user/entities/user.entity';

export type SanitizedUser = Omit<User, 'password'> & {
  encryptpwd: string; 
};
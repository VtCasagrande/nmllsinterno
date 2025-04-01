import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Estendendo o tipo User
   */
  interface User extends DefaultUser {
    role?: string;
  }

  /**
   * Estendendo o tipo Session
   */
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  /**
   * Estendendo o tipo JWT
   */
  interface JWT {
    id: string;
    role?: string;
  }
} 
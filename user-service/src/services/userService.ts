import { PrismaClient } from '@prisma/client';

export class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createUser(username: string, email: string) {
    try {
      const user = await this.prisma.user.create({
        data: { username, email },
      });
      return user;
    } catch (error) {
      console.error('Prisma error creating user:', error);
      throw error;
    }
  }

  async getUserById(id: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new Error('User not found');
      return user;
    } catch (error) {
      console.error('Prisma error getting user:', error);
      throw error;
    }
  }
}
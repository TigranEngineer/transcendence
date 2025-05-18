import { PrismaClient } from '@prisma/client';

export class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUser(request: any) {
    const userId = request.user?.id;
    if (!userId) throw new Error('User ID not found');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return { id: user.id, username: user.username, email: user.email };
  }
}
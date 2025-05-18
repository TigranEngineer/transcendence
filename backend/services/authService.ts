import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

export class AuthService {
  private fastify: any;
  private prisma: PrismaClient;

  constructor(fastify: any) {
    this.fastify = fastify;
    this.prisma = new PrismaClient();
  }

  async register(username: string, email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { username, email, password: hashedPassword },
    });
    const token = this.fastify.jwt.sign({ id: user.id });
    return { token, user: { id: user.id, username: user.username, email: user.email } };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = this.fastify.jwt.sign({ id: user.id });
      return { token, user: { id: user.id, username: user.username, email: user.email } };
    }
    throw new Error('Invalid credentials');
  }

  async logout() {
    // Handle logout logic if needed
  }
}
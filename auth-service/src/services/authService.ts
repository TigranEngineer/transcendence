import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class AuthService {
  private prisma: PrismaClient;
  private fastify: any;

  constructor(fastify: any) {
    this.fastify = fastify;
    this.prisma = new PrismaClient();
  }

  async register(username: string, email: string, password: string) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const secret = speakeasy.generateSecret({ name: `ft_transcendence:${email}` });

      const userResponse = await axios.post('http://user-service:3000/api/users', { username, email });
      const userId = userResponse.data.id;

      const auth = await this.prisma.userAuth.create({
        data: {
          email,
          password: hashedPassword,
          userId,
          twoFactorSecret: secret.base32
        }
      });

      const token = this.fastify.jwt.sign({ id: userId });
      const qrCodeUrl = secret.otpauth_url ? await QRCode.toDataURL(secret.otpauth_url) : '';
      return { token, user: { id: userId, username, email }, qrCodeUrl };
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const auth = await this.prisma.userAuth.findUnique({ where: { email } });
      if (!auth || !(await bcrypt.compare(password, auth.password))) {
        throw new Error('Invalid credentials');
      }

      const userResponse = await axios.get(`http://user-service:3000/api/users/${auth.userId}`);
      const username = userResponse.data.username || email;

      if (!auth.twoFactorEnabled) {
        const token = this.fastify.jwt.sign({ id: auth.userId });
        return { token, user: { id: auth.userId, username, email }, requires2FA: false };
      }

      const tempToken = this.fastify.jwt.sign(
        { id: auth.userId, type: '2fa' },
        { expiresIn: '5m' }
      );
      return { tempToken, user: { id: auth.userId, username, email }, requires2FA: true };
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  }

  async setup2FA(userId: number) {
    try {
      await this.prisma.userAuth.update({
        where: { userId },
        data: { twoFactorEnabled: true }
      });
      return { message: '2FA enabled successfully' };
    } catch (error) {
      console.error('2FA setup error:', error);
      throw error;
    }
  }

  async verify2FA(code: string, tempToken: string) {
    try {
      const decoded = await this.fastify.jwt.verify(tempToken);
      if (!decoded || typeof decoded !== 'object' || decoded.type !== '2fa' || typeof decoded.id !== 'number') {
        throw new Error('Invalid token');
      }

      const auth = await this.prisma.userAuth.findUnique({ where: { userId: decoded.id } });
      if (!auth || !auth.twoFactorSecret) throw new Error('2FA not set up');

      const isValid = speakeasy.totp.verify({
        secret: auth.twoFactorSecret,
        encoding: 'base32',
        token: code
      });

      if (!isValid) throw new Error('Invalid 2FA code');

      const userResponse = await axios.get(`http://user-service:3000/api/users/${auth.userId}`);
      const username = userResponse.data.username || auth.email;

      const token = this.fastify.jwt.sign({ id: auth.userId });
      return { token, user: { id: auth.userId, username, email: auth.email } };
    } catch (error) {
      console.error('2FA error:', error);
      throw error;
    }
  }

  async logout() {
    // JWT не требует серверного логаута
  }

  async updatePassword(userId: number, newPassword: string) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatedUser = await this.prisma.userAuth.update({
        where: { userId },
        data: { password: hashedPassword }
      });
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }
}
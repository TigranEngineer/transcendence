import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

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
            const userResponse = await axios.post('http://user-service:3000/api/users', { username, email });
            const userId = userResponse.data.id;
            const auth = await this.prisma.userAuth.create({
                data: { email, password: hashedPassword, userId },
            });
            const token = this.fastify.jwt.sign({ id: userId });
            return { token, user: { id: userId, email } };
        } catch (error) {
            console.error('Auth error:', error);
            throw error;
        }
    }

    async login(email: string, password: string) {
        try {
            const auth = await this.prisma.userAuth.findUnique({ where: { email } });
            if (auth && await bcrypt.compare(password, auth.password)) {
                if (auth.twoFASecret) {
                    return { twoFARequired: true, userId: auth.userId };
                }
                const token = this.fastify.jwt.sign({ id: auth.userId });
                return { token, user: { id: auth.userId, email } };
            }
            throw new Error('Invalid credentials');
        } catch (error) {
            console.error('Auth error:', error);
            throw error;
        }
    }

    async logout() {
        // Handle logout logic if needed
    }

    async setup2FA(userId: number) {
        try {
            const speakeasy = require('speakeasy');
            const secret = speakeasy.generateSecret({
                name: `ft_transcendence:${userId}`,
            });
            await this.prisma.userAuth.update({
                where: { userId },
                data: { twoFASecret: secret.base32 },
            });
            return { secret: secret.base32, otpauthUrl: secret.otpauth_url };
        } catch (error) {
            console.error('2FA setup error:', error);
            throw error;
        }
    }
    
    async verify2FA(userId: number, token: string) {
        try {
            const speakeasy = require('speakeasy');
            const userAuth = await this.prisma.userAuth.findUnique({ where: { userId } });
            if (!userAuth || !userAuth.twoFASecret) {
                throw new Error('2FA not enabled');
            }
            const verified = speakeasy.totp.verify({
                secret: userAuth.twoFASecret,
                encoding: 'base32',
                token,
            });
            if (verified) {
                const token = this.fastify.jwt.sign({ id: userId });
                return { token, user: { id: userId, email: userAuth.email } };
            }
            throw new Error('Invalid 2FA code');
        } catch (error) {
            console.error('2FA verification error:', error);
            throw error;
        }
    }
}
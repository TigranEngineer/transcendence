import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import speakeasy from 'speakeasy';//
import QRCode from 'qrcode';//
import { Session } from '@fastify/secure-session';//

// const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS);
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
            const secret = speakeasy.generateSecret({ name: `ft_transcendence:${email}` });//

            const userResponse = await axios.post('http://user-service:3000/api/users', { username, email });
            const userId = userResponse.data.id;

            const auth = await this.prisma.userAuth.create({
                data: {
                    email,
                    password: hashedPassword,
                    userId,
                    twoFactorSecret: secret.base32//
                },
            });
            const token = this.fastify.jwt.sign({ id: userId });
            const qrCodeUrl = secret.otpauth_url
                ? await QRCode.toDataURL(secret.otpauth_url)
                : ''; // Fallback to empty string if undefined//
            return { token, user: { id: userId, email }, qrCodeUrl };//
            // return { token, user: { id: userId, email } };
        } catch (error) {
            console.error('Auth error:', error);
            throw error;
        }
    }

    // async login(email: string, password: string) {
    //     try {
    //         const auth = await this.prisma.userAuth.findUnique({ where: { email } });
    //         if (auth && await bcrypt.compare(password, auth.password)) {
    //             const token = this.fastify.jwt.sign({ id: auth.userId });
    //             return { token, user: { id: auth.userId, email } };
    //         }
    //         throw new Error('Invalid credentials');
    //     } catch (error) {
    //         console.error('Auth error:', error);
    //         throw error;
    //     }
    // }
    ////////////////////
    async login(email: string, password: string, session: any) {
        try {
            const auth = await this.prisma.userAuth.findUnique({ where: { email } });
            if (!auth || !(await bcrypt.compare(password, auth.password))) {
                throw new Error('Invalid credentials');
            }

            if (!auth.twoFactorEnabled) {
                const token = this.fastify.jwt.sign({ id: auth.userId });
                return { token, user: { id: auth.userId, email }, requires2FA: false };
            }

            session.set('userId', auth.userId);
            return { requires2FA: true };
        } catch (error) {
            console.error('Auth error:', error);
            throw error;
        }
    }

    async verify2FA(userId: number, code: string) {
        try {
            const auth = await this.prisma.userAuth.findUnique({ where: { userId } });
            if (!auth || !auth.twoFactorSecret) throw new Error('2FA not set up');

            const isValid = speakeasy.totp.verify({
                secret: auth.twoFactorSecret,
                encoding: 'base32',
                token: code
            });

            if (!isValid) throw new Error('Invalid 2FA code');

            const token = this.fastify.jwt.sign({ id: auth.userId });
            return { token, user: { id: auth.userId, email: auth.email } };
        } catch (error) {
            console.error('2FA error:', error);
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
    /////////////////////////
    async logout() {
    }

    async updatePassword(userId: number, newPassword: string) {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const updatedUser = await this.prisma.userAuth.update({
                where: { userId },
                data: { password: hashedPassword },
            });

            return updatedUser;
        } catch (error) {
            throw error;
        }
    }
}
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

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
            const token = this.fastify.jwt.sign({ userId: userId });
            return { token, user: { id: userId, email } };
        } catch (error) {
            console.error('Auth error:', error);
            throw error;
        }
    }

    async login(email: string, password: string, twoFactorCode?: string) {
        try {
            const auth = await this.prisma.userAuth.findUnique({ where: { email } });
            if (!auth) {
                throw new Error('Invalid credentials');
            }
            if (auth.provider === 'google') {
                throw new Error('Use Google Sign-In for this account');
            }
            if (!auth.password || !(await bcrypt.compare(password, auth.password))) {
                throw new Error('Invalid credentials');
            }
            if (auth.twoFactorEnabled && !twoFactorCode) {
                throw new Error('Two-factor authentication code required');
            }
            if (auth.twoFactorEnabled && twoFactorCode) {
                const verified = speakeasy.totp.verify({
                    secret: auth.twoFactorSecret!,
                    encoding: 'base32',
                    token: twoFactorCode,
                });
                if (!verified) {
                    throw new Error('Invalid 2FA code');
                }
            }
            const token = this.fastify.jwt.sign({ userId: auth.userId });
            return { token, user: { id: auth.userId, email }, twoFactorEnabled: auth.twoFactorEnabled };
        } catch (error) {
            console.error('Auth error:', error);
            throw error;
        }
    }

    async enable2FA(userId: number) {
        try {
            const secret = speakeasy.generateSecret({
                name: `YourApp:${userId}`,
            });
            const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);
            await this.prisma.userAuth.update({
                where: { userId },
                data: { twoFactorSecret: secret.base32, twoFactorEnabled: true },
            });
            return { qrCodeUrl, secret: secret.base32 };
        } catch (error) {
            console.error('2FA enable error:', error);
            throw error;
        }
    }

    async verify2FA(userId: number, code: string) {
        try {
            const auth = await this.prisma.userAuth.findUnique({ where: { userId } });
            if (!auth || !auth.twoFactorSecret) {
                throw new Error('2FA not enabled for this user');
            }
            const verified = speakeasy.totp.verify({
                secret: auth.twoFactorSecret,
                encoding: 'base32',
                token: code,
            });
            if (!verified) {
                throw new Error('Invalid 2FA code');
            }
            return { verified: true };
        } catch (error) {
            console.error('2FA verify error:', error);
            throw error;
        }
    }

    async disable2FA(userId: number) {
        try {
            await this.prisma.userAuth.update({
                where: { userId },
                data: { twoFactorSecret: null, twoFactorEnabled: false },
            });
            return { message: '2FA disabled successfully' };
        } catch (error) {
            console.error('2FA disable error:', error);
            throw error;
        }
    }

    async googleSignIn(googleUser: { id: string; email: string; displayName: string }) {
        try {
            let auth = await this.prisma.userAuth.findUnique({ where: { providerId: googleUser.id } });
            let userId: number;

            if (!auth) {
                // Create new user
                const userResponse = await axios.post('http://user-service:3000/api/users', {
                    username: googleUser.displayName,
                    email: googleUser.email,
                });
                userId = userResponse.data.id;
                auth = await this.prisma.userAuth.create({
                    data: {
                        email: googleUser.email,
                        userId,
                        provider: 'google',
                        providerId: googleUser.id,
                    },
                });
            } else {
                userId = auth.userId;
            }

            const token = this.fastify.jwt.sign({ userId });
            return { token, user: { id: userId, email: googleUser.email } };
        } catch (error) {
            console.error('Google Sign-In error:', error);
            throw error;
        }
    }

    async logout() {
        return { message: 'Logged out' };
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
            console.error('Update password error:', error);
            throw error;
        }
    }
}
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

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
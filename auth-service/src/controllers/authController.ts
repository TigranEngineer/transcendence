import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService';

export const authController = {
    async register(req: FastifyRequest, reply: FastifyReply) {
        const { username, email, password } = req.body as { username: string; email: string; password: string };
        const authService = new AuthService(req.server);
        try {
            const result = await authService.register(username, email, password);
            return reply.status(201).send(result);
        } catch (error) {
            return reply.status(500).send({ error: 'Registration failed' });
        }
    },

    async login(req: FastifyRequest, reply: FastifyReply) {
        const { email, password } = req.body as { email: string; password: string };
        const authService = new AuthService(req.server);
        try {
            const result = await authService.login(email, password);
            return reply.send(result);
        } catch (error) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }
    },

    async logout(req: FastifyRequest, reply: FastifyReply) {
        const authService = new AuthService(req.server);
        try {
            await authService.logout();
            return reply.status(200).send({ message: 'Logged out' });
        } catch (error) {
            return reply.status(500).send({ error: 'Logout failed' });
        }
    },

    async setup2FA(req: FastifyRequest, reply: FastifyReply) {
        const { userId } = req.body as { userId: number };
        const authService = new AuthService(req.server);
        try {
            const result = await authService.setup2FA(userId);
            return reply.status(200).send(result);
        } catch (error) {
            return reply.status(500).send({ error: '2FA setup failed' });
        }
    },
    
    async verify2FA(req: FastifyRequest, reply: FastifyReply) {
        const { userId, code } = req.body as { userId: number; code: string };
        const authService = new AuthService(req.server);
        try {
            const result = await authService.verify2FA(userId, code);
            return reply.send(result);
        } catch (error) {
            return reply.status(401).send({ error: 'Invalid 2FA code' });
        }
    },
};
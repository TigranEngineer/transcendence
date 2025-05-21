import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService';

export const authController = {
    async register(req: FastifyRequest, reply: FastifyReply) {
        const { email, password } = req.body as { email: string; password: string };
        const authService = new AuthService(req.server);
        try {
            const result = await authService.register(email, password);
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
};
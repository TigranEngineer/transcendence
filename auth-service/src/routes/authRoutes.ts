import { FastifyInstance } from 'fastify';
import { authController } from '../controllers/authController';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/api/auth/register', authController.register);
    fastify.post('/api/auth/login', authController.login);
    fastify.post('/api/auth/logout', authController.logout);
    fastify.post('/api/auth/setup-2fa', authController.setup2FA);
    fastify.post('/api/auth/verify-2fa', authController.verify2FA);
}
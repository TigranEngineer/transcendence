import { FastifyInstance } from 'fastify';
import { authController } from '../controllers/authController';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/api/auth/register', authController.register);
    fastify.post('/api/auth/login', authController.login);
    fastify.post('/api/auth/logout', authController.logout);
}
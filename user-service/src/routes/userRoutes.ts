import { FastifyInstance } from 'fastify';
import { userController } from '../controllers/userController';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.post('/api/users', userController.create);
  fastify.get('/api/users/:id', userController.getById);
}
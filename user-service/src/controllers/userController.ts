import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/userService';

// Define the expected shape of params
interface GetByIdParams {
  id: string;
}

export const userController = {
  async create(req: FastifyRequest, reply: FastifyReply) {
    const { username, email } = req.body as { username: string; email: string };
    const userService = new UserService();
    try {
      const user = await userService.createUser(username, email);
      return reply.status(201).send(user);
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to create user' });
    }
  },

  async getById(req: FastifyRequest<{ Params: GetByIdParams }>, reply: FastifyReply) {
    const id = parseInt(req.params.id);
    const userService = new UserService();
    try {
      const user = await userService.getUserById(id);
      return reply.send(user);
    } catch (error) {
      return reply.status(404).send({ error: 'User not found' });
    }
  },
};
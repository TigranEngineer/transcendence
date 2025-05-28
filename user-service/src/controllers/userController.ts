import { FastifyRequest, FastifyReply } from 'fastify';
import { CustomError, UserService } from '../services/userService';

// Define the expected shape of params
interface GetByIdParam {
  id: string;
}
interface GetByUsernameParam {
  username: string;
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

  async getById(req: FastifyRequest<{ Params: GetByIdParam }>, reply: FastifyReply) {
    const id = parseInt(req.params.id);
    const userService = new UserService();
    try {
      const user = await userService.getUserById(id);
      return reply.send(user);
    } catch (error) {
      return reply.status(404).send({ error: 'User not found' });
    }
  },

  async getByUsername(req: FastifyRequest<{ Params: GetByUsernameParam }>, reply: FastifyReply) {
    const username = req.params.username;
    console.log('username = ' + username);
    const userService = new UserService();
    try {
      const user = await userService.getUserByUsername(username);
      console.log(JSON.stringify(user, undefined, 2));
      return reply.send(user);
    } catch (error) {
      return reply.status(404).send({ error: 'User not found' });
    }
  },

  async changeUsername(req: FastifyRequest, reply: FastifyReply) {
    const { username, id } = req.body as { username: string; id: number };
    const userService = new UserService();

    if (!username) {
      return reply.status(400).send({ error: 'Bad request' });
    }

    try {
      const user = await userService.updateUsername(id, username);
      console.log(JSON.stringify(user, undefined, 2));
      return reply.send(user);
    } catch (error) {
      if (error instanceof CustomError) {
        reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Failed to update username' });
    }
  },

  async changePhoto(req: FastifyRequest, reply: FastifyReply) {
    const { photo, id } = req.body as { photo: string; id: number };
    const userService = new UserService();

    if (!photo) {
      return reply.status(400).send({ error: 'Bad request' });
    }

    try {
      const user = await userService.updatePhoto(id, photo);
      console.log(JSON.stringify(user, undefined, 2));
      return reply.send(user);
    } catch (error) {
      if (error instanceof CustomError) {
        reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Failed to update username' });
    }
  },
};
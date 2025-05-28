import { FastifyInstance } from 'fastify';
import { userController } from '../controllers/userController';
import addFriend  from '../controllers/addFriendController';
import blockUser  from '../controllers/blockUserController';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.post('/api/users', userController.create);
  fastify.get('/api/users/:id', userController.getById);
  fastify.get('/api/users/username/:username', userController.getByUsername);
  fastify.patch('/api/users/change/username', userController.changeUsername);
  fastify.patch('/api/users/change/photo', userController.changePhoto);
  fastify.post('/api/users/friends', addFriend);
  fastify.post('/api/users/block', blockUser);
}
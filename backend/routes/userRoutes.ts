import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';

export async function userRoutes(fastify: any) {
  const userController = new UserController();

  fastify.get('/user', { preHandler: authMiddleware }, userController.getUser.bind(userController));
}
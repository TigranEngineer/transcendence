import { AuthController } from '../controllers/authController';
import { RegisterRequest, LoginRequest } from '../models/authModel';

const registerSchema = {
  body: {
    type: 'object',
    required: ['username', 'email', 'password'],
    properties: {
      username: { type: 'string', minLength: 3 },
      email: { type: 'string' },
      password: { type: 'string', minLength: 6 },
    },
  },
};

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
    },
  },
};

export async function authRoutes(fastify: any) {
  const authController = new AuthController(fastify);

  fastify.post('/register', { schema: registerSchema }, async (request: any, reply: any) => {
    console.log('Received POST /api/auth/register:', request.body);
    return authController.register(request, reply);
  });

  fastify.post('/login', { schema: loginSchema }, authController.login.bind(authController));
  fastify.post('/logout', authController.logout.bind(authController));
}
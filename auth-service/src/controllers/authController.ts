import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService';
import { validateEmail, validatePassword } from '../utils/validator';

export const authController = {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const { username, email, password } = req.body as { username: string; email: string; password: string };
    if (!email || !username || !password) {
      return reply.status(400).send({ error: 'All fields are required' });
    }
    if (!validateEmail(email)) {
      return reply.status(400).send({ error: 'Invalid email format' });
    }
    if (!validatePassword(password)) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' });
    }
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

  async setup2FA(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user as { id: number };
    const authService = new AuthService(req.server);
    try {
      const result = await authService.setup2FA(user.id);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ error: '2FA setup failed' });
    }
  },

  async verify2FA(req: FastifyRequest, reply: FastifyReply) {
    const { code, tempToken } = req.body as { code: string; tempToken: string };
    const authService = new AuthService(req.server);
    try {
      const result = await authService.verify2FA(code, tempToken);
      return reply.send(result);
    } catch (error) {
      return reply.status(401).send({ error: 'Invalid 2FA code or token' });
    }
  },

  async logout(req: FastifyRequest, reply: FastifyReply) {
    return reply.status(200).send({ message: 'Logged out' });
  },

  async changePassword(req: FastifyRequest, reply: FastifyReply) {
    const { id, password } = req.body as { id: number; password: string };
    if (!validatePassword(password)) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' });
    }
    const authService = new AuthService(req.server);
    try {
      const result = await authService.updatePassword(id, password);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to update password' });
    }
  }
};
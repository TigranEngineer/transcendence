import { FastifyInstance } from 'fastify';
import { authController } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import oauth2 from '@fastify/oauth2';

export async function authRoutes(fastify: FastifyInstance) {
  // Google OAuth configuration
  fastify.register(oauth2 as any, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID || '',
        secret: process.env.GOOGLE_CLIENT_SECRET || '',
      },
      auth: oauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: '/api/auth/google',
    callbackUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback',
  });

  fastify.post('/api/auth/register', authController.register);
  fastify.post('/api/auth/login', authController.login);
  fastify.post('/api/auth/logout', authController.logout);
  fastify.patch('/api/auth/change/password', { preHandler: [authenticate] }, authController.changePassword);
  fastify.post('/api/auth/2fa/enable', { preHandler: [authenticate] }, authController.enable2FA);
  fastify.post('/api/auth/2fa/verify', { preHandler: [authenticate] }, authController.verify2FA);
  fastify.post('/api/auth/2fa/disable', { preHandler: [authenticate] }, authController.disable2FA);
  fastify.get('/api/auth/google/callback', authController.googleCallback);
}
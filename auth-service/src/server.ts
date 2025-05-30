import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { authRoutes } from './routes/authRoutes';
import { authenticate } from './middlewares/authMiddleware';

const fastify = Fastify({ logger: true });

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3003',
  'https://localhost:8443',
  process.env.GOOGLE_REDIRECT_URI
].filter((origin): origin is string => typeof origin === 'string');

fastify.register(cors, {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
});

fastify.decorate('authenticate', authenticate);

fastify.register(authRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Auth Service running on http://0.0.0.0:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
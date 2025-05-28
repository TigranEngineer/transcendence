import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt'
import { userRoutes } from './routes/userRoutes';
import { authenticate } from './middlewares/authMiddleware';

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003', 'http://localhost:4000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  credentials: true
});

fastify.register(userRoutes);
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
});

fastify.decorate('authenticate', authenticate);


const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('User Service running on http://0.0.0.0:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
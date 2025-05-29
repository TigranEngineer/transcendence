import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { tournamentRoutes } from './routes/tournamentRoutes';
import { authenticate } from './middlewares/authMiddleware';

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003', 'http://localhost:3004'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

fastify.register(tournamentRoutes);
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
});

fastify.decorate('authenticate', authenticate);

const start = async () => {
  try {
    await fastify.listen({ port: 3004, host: '0.0.0.0' });
    console.log('Tournament Service running on http://0.0.0.0:3004');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
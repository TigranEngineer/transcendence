import Fastify from 'fastify';
import cors from '@fastify/cors';
import { userRoutes } from './routes/userRoutes';

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
});

fastify.register(userRoutes);

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
import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { authRoutes } from './routes/authRoutes';

const fastify = Fastify({ logger: true });

fastify.register(cors, {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
});

fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
});

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
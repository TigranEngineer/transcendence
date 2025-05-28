import Fastify, { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import passport from '@fastify/passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/authRoutes';
import { authenticate } from './middlewares/authMiddleware';

const fastify: FastifyInstance = Fastify({
  https: {
    key: fs.readFileSync(path.join(__dirname, '../certs/localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../certs/localhost.pem')),
  },
  logger: true,
});

const prisma = new PrismaClient();

fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003', 'http://localhost:4000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
});

fastify.register(passport.initialize());

passport.use(
  'local',
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const auth = await prisma.userAuth.findUnique({ where: { email } });
      if (!auth) return done(null, false, { message: 'Invalid email or password' });
      const isMatch = await bcrypt.compare(password, auth.password);
      if (!isMatch) return done(null, false, { message: 'Invalid email or password' });
      return done(null, auth);
    } catch (err) {
      return done(err);
    }
  }),
);

fastify.decorate('authenticate', authenticate);
fastify.register(authRoutes, { prefix: '/api/auth' });

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Auth Service running on https://0.0.0.0:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
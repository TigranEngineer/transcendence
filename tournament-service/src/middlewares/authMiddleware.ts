import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from '@fastify/jwt'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthPayload {
  userId: number;
  iat: number;
  exp: number;
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'No token provided or invalid format' });
    }

    const decoded = await request.jwtVerify() as AuthPayload;
    const userId = decoded.userId;

    if (!userId) {
      return reply.status(401).send({ error: 'Invalid token payload' });
    }

    request.user = { id: userId };
  } catch (error) {
    console.error('Authentication error:', error);
    return reply.status(401).send({ error: 'Invalid token' });
  }
};
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthPayload {
  userId: number;
  iat: number; // Issued at
  exp: number; // Expiration
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = await request.jwtVerify() as AuthPayload;
    const userId = decoded.userId;

    if (!userId) {
      return reply.status(401).send({ error: 'Invalid token payload' });
    }

    const userAuth = await prisma.userAuth.findUnique({
      where: { userId },
    });

    if (!userAuth) {
      return reply.status(401).send({ error: 'User not found' });
    }

    request.body = { ...request.body as Record<string, any>, id: userId };

  } catch (error) {
    console.error('Authentication error:', error);
    return reply.status(401).send({ error: 'Invalid token' });
  }
};
import { FastifyInstance } from 'fastify';
import { chatHandler } from '../controllers/chatController';

export default async function chatRoutes(fastify: FastifyInstance) {
    fastify.get('/ws', { websocket: true }, chatHandler);
}
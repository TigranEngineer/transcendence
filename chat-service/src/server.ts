import Fastify from 'fastify';
import WebSocketPlugin from '@fastify/websocket';
import chatRoutes from './routes/chatRoutes';

const fastify = Fastify({ logger: true });

fastify.register(WebSocketPlugin);
fastify.register(chatRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log('Chat service running on http://0.0.0.0:4000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
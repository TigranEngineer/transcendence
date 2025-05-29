import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/authMiddleware';
import { createTournamentController, getPlayerStatsController,  getNextMatchController, recordMatchResultController, getUserMatchHistoryController, playVsPlayerController } from '../controllers/tournamentController';

export async function tournamentRoutes(fastify: FastifyInstance) {
  fastify.post('/api/tournament/create', { preHandler: authenticate }, createTournamentController);
  fastify.post('/api/tournament/next-match', { preHandler: authenticate }, getNextMatchController);
  fastify.post('/api/tournament/record-match', { preHandler: authenticate }, recordMatchResultController);
  fastify.post('/api/tournament/play-vs-player', { preHandler: authenticate }, playVsPlayerController);
  fastify.get('/api/tournament/match-history', { preHandler: authenticate }, getUserMatchHistoryController);
  fastify.get('/api/tournament/playerStats/:userId', getPlayerStatsController);

}
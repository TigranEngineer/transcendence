import { FastifyRequest, FastifyReply } from 'fastify';
import { createTournament, getNextMatch, recordMatchResult, recordVsPlayerMatch, getUserMatchHistory, getPlayerStats } from '../services/tournamentService';

interface CreateTournamentRequest {
  guestIds: number[];
}

interface RecordMatchResultRequest {
  matchId: number;
  winnerId: number;
}

interface PlayVsPlayerRequest {
  secondPlayerId: number;
  isHostWinner: boolean;
}

interface GetByIdParam {
  userId: string;
}

export const createTournamentController = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { guestIds } = request.body as CreateTournamentRequest;
    const hostId = (request.user as any).id;

    const tournament = await createTournament(hostId, guestIds);
    reply.status(201).send({ tournamentId: tournament.id });
  } catch (error) {
    reply.status(400).send({ error: (error as Error).message });
  }
};

export const getNextMatchController = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { tournamentId } = request.body as { tournamentId: number };
    const nextMatch = await getNextMatch(tournamentId);

    if (!nextMatch) {
      reply.status(200).send({ message: 'Tournament completed' });
      return;
    }

    reply.status(200).send(nextMatch);
  } catch (error) {
    reply.status(400).send({ error: (error as Error).message });
  }
};

export const recordMatchResultController = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { matchId, winnerId } = request.body as RecordMatchResultRequest;
    const result = await recordMatchResult(matchId, winnerId);
    reply.status(200).send({ message: 'Match result recorded', result });
  } catch (error) {
    reply.status(400).send({ error: (error as Error).message });
  }
};

export const playVsPlayerController = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    
    const { secondPlayerId, isHostWinner } = request.body as PlayVsPlayerRequest;
    const hostId = (request.user as any).id;
    const result = await recordVsPlayerMatch(hostId, secondPlayerId, isHostWinner);
    reply.status(200).send({ message: 'Match recorded successfully', result });
  } catch (error) {
    reply.status(400).send({ error: (error as Error).message });
  }
};

export const getPlayerStatsController = async (request: FastifyRequest<{ Params: GetByIdParam }>, reply: FastifyReply) => {
  
  try {
    const userId = request.params.userId;
    const result = await getPlayerStats(+userId);
    reply.status(200).send(result);
  } catch (error) {
    reply.status(400).send({ error: (error as Error).message });
  }
};

export const getUserMatchHistoryController = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).id;
    const matchHistory = await getUserMatchHistory(userId);
    reply.status(200).send(matchHistory);
  } catch (error) {
    reply.status(400).send({ error: (error as Error).message });
  }
};
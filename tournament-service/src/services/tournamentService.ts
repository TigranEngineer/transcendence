import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createTournament = async (hostId: number, guestIds: number[]) => {
  const playerIds = [hostId, ...guestIds];
  if (playerIds.length !== 4 || new Set(playerIds).size !== 4) {
    throw new Error('Tournament must have exactly 4 unique players');
  }

  // Validate players exist
  const players = await prisma.user.findMany({ where: { id: { in: playerIds } } });
  if (players.length !== 4) {
    throw new Error('One or more players not found');
  }

  // Create the tournament and link players
  const tournament = await prisma.tournament.create({
    data: {
      hostId,
      status: 'ongoing',
      players: {
        create: playerIds.map(userId => ({ userId })),
      },
    },
  });

  return tournament;
};

export const getNextMatch = async (tournamentId: number) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      matches: true,
      players: { include: { user: { select: { id: true, username: true } } } },
    },
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const matches = tournament.matches;
  const playerIds = tournament.players.map(player => player.userId);

  if (tournament.status === 'completed') {
    throw new Error('Tournament already completed');
  }

  // Single-elimination: 4 players -> 2 semifinals -> 1 final
  if (matches.length === 0) {
    // Semifinal 1: Player 1 vs Player 2
    const match = await prisma.match.create({
      data: {
        tournamentId,
        player1Id: playerIds[0],
        player2Id: playerIds[1],
      },
    });

    const player1 = tournament.players.find(p => p.userId === playerIds[0])!.user;
    const player2 = tournament.players.find(p => p.userId === playerIds[1])!.user;
    return { matchId: match.id, player1, player2 };
  }

  if (matches.length === 1) {
    // Semifinal 2: Player 3 vs Player 4
    const match = await prisma.match.create({
      data: {
        tournamentId,
        player1Id: playerIds[2],
        player2Id: playerIds[3],
      },
    });

    const player1 = tournament.players.find(p => p.userId === playerIds[2])!.user;
    const player2 = tournament.players.find(p => p.userId === playerIds[3])!.user;
    return { matchId: match.id, player1, player2 };
  }

  if (matches.length === 2) {
    // Final: Winners of semifinals
    const semifinal1 = matches[0];
    const semifinal2 = matches[1];

    if (!semifinal1.winnerId || !semifinal2.winnerId) {
      throw new Error('Previous matches must have winners');
    }

    const match = await prisma.match.create({
      data: {
        tournamentId,
        player1Id: semifinal1.winnerId,
        player2Id: semifinal2.winnerId,
      },
    });

    const player1 = tournament.players.find(p => p.userId === semifinal1.winnerId)!.user;
    const player2 = tournament.players.find(p => p.userId === semifinal2.winnerId)!.user;
    return { matchId: match.id, player1, player2 };
  }

  // Tournament complete
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: 'completed' },
  });
  return null; // No more matches
};

// Initialize or update PlayerStats
const initializeOrUpdatePlayerStats = async (userId: number, updates: { games?: number; wins?: number }) => {
  const stats = await prisma.playerStats.findUnique({ where: { userId } });
  if (!stats) {
    return prisma.playerStats.create({
      data: {
        userId,
        games: updates.games ?? 0,
        wins: updates.wins ?? 0,
      },
    });
  }
  return prisma.playerStats.update({
    where: { userId },
    data: {
      games: { increment: updates.games ?? 0 },
      wins: { increment: updates.wins ?? 0 },
    },
  });
};

export const recordMatchResult = async (matchId: number, winnerId: number) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });

  if (!match) {
    throw new Error('Match not found');
  }

  if (match.winnerId) {
    throw new Error('Match already has a winner');
  }

  if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
    throw new Error('Winner must be one of the players');
  }

  // Update match with winner
  await prisma.match.update({
    where: { id: matchId },
    data: { winnerId },
  });

  // Update stats: both players played a game, winner gets a win
  await initializeOrUpdatePlayerStats(match.player1Id, { games: 1, wins: winnerId === match.player1Id ? 1 : 0 });
  await initializeOrUpdatePlayerStats(match.player2Id, { games: 1, wins: winnerId === match.player2Id ? 1 : 0 });

  return { matchId, winnerId };
};

// New function for Play vs Player
export const recordVsPlayerMatch = async (player1Id: number, player2Id: number, isHostWinner: boolean) => {
  if (player1Id === player2Id) {
    throw new Error('Players must be different');
  }

  // Validate players exist
  const players = await prisma.user.findMany({ where: { id: { in: [player1Id, player2Id] } } });
  if (players.length !== 2) {
    throw new Error('One or both players not found');
  }

  // Determine winner
  const winnerId = isHostWinner ? player1Id : player2Id;

  // Create match (no tournamentId since this is a standalone match)
  const match = await prisma.match.create({
    data: {
      player1Id,
      player2Id,
      winnerId,
    },
  });

  // Update stats
  await initializeOrUpdatePlayerStats(player1Id, { games: 1, wins: isHostWinner ? 1 : 0 });
  await initializeOrUpdatePlayerStats(player2Id, { games: 1, wins: isHostWinner ? 0 : 1 });

  return { matchId: match.id, winnerId };
};

export const getPlayerStats = async (userId: number) => {
  let stats = await prisma.playerStats.findUnique({ where: { userId } });
  if (!stats) {
    stats = await prisma.playerStats.create({
      data: {
        userId,
        games: 0,
        wins: 0,
      },
    });
  }
  console.table(stats);
  return stats;
};

export const getUserMatchHistory = async (userId: number) => {
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { player1Id: userId },
        { player2Id: userId },
      ],
    },
    include: {
      player1: { select: { username: true } },
      player2: { select: { username: true } },
      winner: { select: { username: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return matches.map(match => ({
    matchId: match.id,
    player1Name: match.player1.username,
    player2Name: match.player2.username,
    winnerName: match.winner?.username || null,
    date: match.createdAt,
  }));
};
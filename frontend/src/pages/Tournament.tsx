import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getUser, getStats, getUserByUsername } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { UserResponse, WinsAndGames } from '../types/auth';
import { useTranslation } from 'react-i18next';

const Tournament: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [players, setPlayers] = useState<(UserResponse | null)[]>([null, null, null]);
  const [usernames, setUsernames] = useState<string[]>(['', '', '']);
  const [isLoading, setIsLoading] = useState<boolean[]>([false, false, false]);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<UserResponse | null>(null);
  const { username } = useParams<{ username?: string }>();
  const [stats, setStats] = useState<WinsAndGames | null>(null);
  const [tournamentPhase, setTournamentPhase] = useState<
    'setup' | 'semi-final' | 'final' | 'completed'
  >('setup');
  const [matchResult, setMatchResult] = useState<{
    winner: UserResponse | null;
    score: string;
  } | null>(null);
  const [finalWinner, setFinalWinner] = useState<UserResponse | null>(null);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [currentMatch, setCurrentMatch] = useState<{
    player1: UserResponse | null;
    player2: UserResponse | null;
  }>({
    player1: null,
    player2: null,
  });

  const token = localStorage.getItem('token');
  const id = localStorage.getItem('id');

  // Fetch current user and stats only when token, id, or username changes
  useEffect(() => {
    const fetchUser = async () => {
      if (!token || !id) {
        toast.error(t('login_error'));
        navigate('/Profile');
        return;
      }

      try {
        const userData = username
          ? await getUserByUsername(token, username)
          : await getUser(token, id);
        if (!userData) {
          toast.error(t('user_not_found_error'));
          navigate('/Profile');
          return;
        }
        setUser(userData);

        const statsData = await getStats(token, userData.id.toString());
        setStats(statsData);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || t('fetch_error');
        toast.error(errorMessage);
        navigate('/Profile');
      }
    };

    fetchUser();
  }, [token, id, username, navigate, t]);

  // Set up current match based on tournament phase
  useEffect(() => {
    if (tournamentPhase === 'semi-final' && players[0] && players[1]) {
      setCurrentMatch({ player1: players[0], player2: players[1] });
    } else if (tournamentPhase === 'final' && matchResult?.winner && players[2]) {
      setCurrentMatch({ player1: matchResult.winner, player2: players[2] });
    }
  }, [tournamentPhase, players, matchResult]);

  // Handle username input changes
  const handleUsernameChange = (index: number, value: string) => {
    const newUsernames = [...usernames];
    newUsernames[index] = value;
    setUsernames(newUsernames);
    setError('');
  };

  // Fetch user by username and add to players array
  const handleLogin = async (index: number) => {
    const username = usernames[index].trim();
    if (!username) {
      toast.error(t('empty_username_error'));
      return;
    }

    // Prevent duplicate usernames
    const otherUsernames = usernames
      .filter((_, i) => i !== index)
      .map(u => u.trim());
    if (otherUsernames.includes(username)) {
      toast.error(t('duplicate_username_error'));
      return;
    }

    // Check for valid token
    if (!token) {
      toast.error(t('unauthorized_error'));
      navigate('/Profile');
      return;
    }

    try {
      setIsLoading(prev => {
        const newLoading = [...prev];
        newLoading[index] = true;
        return newLoading;
      });

      // Fetch user by username
      const userData = await getUserByUsername(token, username);
      if (!userData) {
        toast.error(t('user_not_found_error'));
        return;
      }

      // Add user to players array
      const newPlayers = [...players];
      newPlayers[index] = userData;
      setPlayers(newPlayers);
      toast.success(t('player_added', { username }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || t('fetch_error');
      toast.error(errorMessage);
    } finally {
      setIsLoading(prev => {
        const newLoading = [...prev];
        newLoading[index] = false;
        return newLoading;
      });
    }
  };

  const allPlayersReady = players.every(player => player !== null);

  // Start the tournament
  const startTournament = () => {
    if (!allPlayersReady) {
      toast.error(t('not_all_players_ready'));
      return;
    }
    setTournamentPhase('semi-final');
    toast.info(t('tournament_start'));
  };

  // Handle match end
  const handleMatchEnd = (winner: UserResponse, score: string) => {
    setMatchResult({ winner, score });
    if (tournamentPhase === 'semi-final') {
      setTournamentPhase('final');
    } else if (tournamentPhase === 'final') {
      setFinalWinner(winner);
      setTournamentPhase('completed');
      toast.success(t('tournament_completed', { username: winner.username }));
    }
  };

  // Placeholder game logic (to be replaced with actual game)
  const startMatch = () => {
    if (!user || !players[0] || !players[1] || !players[2]) return;
    // TODO: Integrate actual game logic (e.g., from PVP.tsx)
    // For now, simulate a match
    setTimeout(() => {
      if (!currentMatch.player1 || !currentMatch.player2) return;
      const winner = Math.random() > 0.5 ? currentMatch.player1 : currentMatch.player2;
      const score = Math.random() > 0.5 ? '5-3' : '3-5';
      setPlayer1Score(0);
      setPlayer2Score(0);
      handleMatchEnd(winner, score);
    }, 2000);
  };

  // Start match when currentMatch changes
  useEffect(() => {
    if (tournamentPhase === 'semi-final' || tournamentPhase === 'final') {
      startMatch();
    }
  }, [currentMatch]);

  // Restart the tournament
  const handleRestartTournament = () => {
    setPlayers([null, null, null]);
    setUsernames(['', '', '']);
    setIsLoading([false, false, false]);
    setError('');
    setTournamentPhase('setup');
    setMatchResult(null);
    setFinalWinner(null);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setCurrentMatch({ player1: null, player2: null });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6">
      <h2 className="text-3xl font-extrabold text-blue-700 mb-6 text-center">
        {t('tournament')}
      </h2>

      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md mx-auto">
        {tournamentPhase === 'setup' ? (
          <div className="space-y-6">
            {[0, 1, 2].map(index => (
              <div key={index} className="space-y-2">
                <label className="block text-gray-800 font-medium">
                  {t('player')} {index + 1}
                </label>
                <input
                  type="text"
                  value={usernames[index]}
                  onChange={e => handleUsernameChange(index, e.target.value)}
                  placeholder={t('enter_username')}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                  disabled={players[index] !== null || isLoading[index]}
                />
                <button
                  onClick={() => handleLogin(index)}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                  disabled={players[index] !== null || isLoading[index]}
                >
                  {isLoading[index]
                    ? t('loading')
                    : players[index]
                    ? t('player_added', { username: players[index]!.username })
                    : t('log_in')}
                </button>
              </div>
            ))}
            {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
            {allPlayersReady && (
              <div className="mt-6 text-center">
                <p className="text-green-600 font-medium mb-4">
                  {t('all_players_ready')}
                </p>
                <button
                  onClick={startTournament}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  {t('start_tournament')}
                </button>
              </div>
            )}
            {!allPlayersReady && (
              <p className="mt-4 text-gray-600 text-center">
                {t('waiting_for_players')}
              </p>
            )}
          </div>
        ) : tournamentPhase === 'completed' ? (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-green-600 mb-4">
              {t('tournament_winner', {
                username: finalWinner?.username ?? t('unknown'),
              })}
            </h3>
            <button
              onClick={handleRestartTournament}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {t('restart_tournament')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center">
              {t(tournamentPhase === 'semi-final' ? 'semi_final' : 'final_match')}
            </h3>
            <div className="text-center text-gray-800">
              <p>
                {currentMatch.player1?.username ?? t('unknown')} vs{' '}
                {currentMatch.player2?.username ?? t('unknown')}
              </p>
              <p>
                {t('score')}: {player1Score} - {player2Score}
              </p>
              {matchResult && (
                <p className="text-green-600">
                  {t('match_winner', {
                    username: matchResult.winner?.username ?? t('unknown'),
                    score: matchResult.score,
                  })}
                </p>
              )}
            </div>
            <canvas
              id="renderCanvas"
              ref={canvasRef}
              className="w-full h-64 border-2 border-blue-800 mx-auto rounded-lg"
              aria-label={t('match_canvas')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournament;
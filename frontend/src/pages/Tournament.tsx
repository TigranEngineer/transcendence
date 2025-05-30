import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as BABYLON from '@babylonjs/core';
import { useTranslation } from 'react-i18next';
import { UserResponse } from '../types/auth';
import { getUser, getUserByUsername } from '../services/api';

interface SmartPongProps {
  onTournamentEnd?: (winnerUsername: string) => void;
}

interface TournamentPlayer {
  username: string;
  id: number;
}

interface Match {
  player1: string;
  player2: string;
  stage: 'semi-final-1' | 'semi-final-2' | 'final';
}

const SmartPong: React.FC<SmartPongProps> = ({ onTournamentEnd }) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation();


  const token = localStorage.getItem('token');
  const id = localStorage.getItem('id');
  var siteOwnerUsername = "SiteOwner";
  
  // Site owner's username (replace with your actual source if different)
  
  // Initialize players with site owner as Player 1
  const [players, setPlayers] = useState<TournamentPlayer[]>([
      { username: siteOwnerUsername, id: 1 },
      { username: '', id: 2 },
      { username: '', id: 3 },
      { username: '', id: 4 },
    ]);
    const [myplayer1, setPlayer1] = useState<(UserResponse | null)>(null);
    const [myplayer2, setPlayer2] = useState<(UserResponse | null)>(null);
    const [myplayer3, setPlayer3] = useState<(UserResponse | null)>(null);
    const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
    const [winners, setWinners] = useState<string[]>([]);
    const [player1Name, setPlayer1Name] = useState<string>('');
    const [player2Name, setPlayer2Name] = useState<string>('');
    const [player1Score, setPlayer1Score] = useState<number>(0);
    const [player2Score, setPlayer2Score] = useState<number>(0);
    const [maxScore, setMaxScore] = useState<number>(5);
    const [showLogin, setShowLogin] = useState<boolean>(true);
    const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showWinnerScreen, setShowWinnerScreen] = useState<boolean>(false);
  const [winnerText, setWinnerText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const input = useRef<{ w: boolean; s: boolean; arrowup: boolean; arrowdown: boolean }>({
    w: false,
    s: false,
    arrowup: false,
    arrowdown: false,
  });
  const lastWallHit = useRef<string | null>(null);
  const gameRunning = useRef<boolean>(false);
  const isGamePaused = useRef<boolean>(false);
  const leftPaddleVelocity = useRef<number>(0);
  const rightPaddleVelocity = useRef<number>(0);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const { username } = useParams<{ username?: string }>();




  const fetchUser = async () => {
        if (!token || !id) {
          toast.error('Please log in to play');
          navigate('/login');
          return;
        }
  
        try {
          if (username) {
            const userData = await getUserByUsername(token, username);
            setUser(userData);
            siteOwnerUsername = userData.username;
          } else {
            const userData = await getUser(token, id);
            setUser(userData);
            siteOwnerUsername = userData.username;
          }
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Failed to fetch user data');
          navigate('/login');
        }
      };
  
      // Only fetch if user is not already set
      if (!user) {
        fetchUser();
        // siteOwnerUsername = user!.username;
      }







  // Handle input for Players 2, 3, 4
  const handlePlayerInput = (id: number, value: string) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, username: value } : player
      )
    );
  };

//   const handleLogin = async () => {
// 	// Validate all usernames
// 	const filledUsernames = players.filter((p) => p.username.trim() !== '');
// 	if (filledUsernames.length != 4) {
// 	  setError(t('enter_all_usernames'));
// 	  return;
// 	}
// 	if (new Set(players.map((p) => p.username)).size !== 4) {
// 	  setError(t('usernames_must_be_unique'));
// 	  return;
// 	}
// 	if (!siteOwnerUsername.trim()) {
// 	  setError(t('site_owner_username_required'));
// 	  return;
// 	}
  
// 	const playerData = await getUserByUsername(token!, players[1].username.trim());
// 	await setPlayer1(playerData);
// 	if (!playerData) {
// 	  setError(t('user_dont_exist'));
// 	  return;
// 	}
  
// 	const playerData2 = await getUserByUsername(token!, players[2].username.trim());
// 	await setPlayer2(playerData2);
// 	if (!playerData2) {
// 	  setError(t('user_dont_exist'));
// 	  return;
// 	}
  
// 	const playerData3 = await getUserByUsername(token!, players[3].username.trim());
// 	await setPlayer3(playerData3);
// 	if (!playerData3) {
// 	  setError(t('user_dont_exist'));
// 	  return;
// 	}
  
// 	// Randomly shuffle players for first semi-final
// 	const shuffled = [...players].sort(() => Math.random() - 0.5);
// 	setCurrentMatch({
// 	  player1: shuffled[0].username,
// 	  player2: shuffled[1].username,
// 	  stage: 'semi-final-1',
// 	});
// 	setPlayer1Name(shuffled[0].username);
// 	setPlayer2Name(shuffled[1].username);
// 	setShowLogin(false);
// 	setShowMenu(true);
// 	console.log('Tournament started: Semi-Final 1', shuffled[0].username, 'vs', shuffled[1].username);
//   };

const handleLogin = async () => {
	// Validate all usernames
	const filledUsernames = players.filter((p) => p.username.trim() !== '');
	if (new Set(players.map((p) => p.username)).size !== 4) {
	  setError(t('usernames_must_be_unique'));
	  return;
	}
	if (filledUsernames.length < 4) {
	  setError(t('enter_all_usernames'));
	  return;
	}
	if (!siteOwnerUsername.trim()) {
	  setError(t('site_owner_username_required'));
	  return;
	}
  
	try {
	  const playerData = await getUserByUsername(token!, players[1].username.trim());
	  if (!playerData) {
		toast.error('User does not exist');
		setError(t('user_dont_exist'));
		return;
	  }
	  setPlayer1(playerData);
	} catch (error: any) {
		toast.error('User does not exist');
	  setError(t('user_dont_exist') || error.response?.data?.error || 'Failed to fetch user data');
	  return;
	}
  
	try {
	  const playerData2 = await getUserByUsername(token!, players[2].username.trim());
	  if (!playerData2) {
		setError(t('user_dont_exist'));
		toast.error('User does not exist');
		return;
	  }
	  setPlayer2(playerData2);
	} catch (error: any) {
		toast.error('User does not exist');
	  setError(t('user_dont_exist') || error.response?.data?.error || 'Failed to fetch user data');
	  return;
	}
  
	try {
	  const playerData3 = await getUserByUsername(token!, players[3].username.trim());
	  if (!playerData3) {
		toast.error('User does not exist');
		setError(t('user_dont_exist'));
		return;
	  }
	  setPlayer3(playerData3);
	} catch (error: any) {
		toast.error('User does not exist');
	  setError(t('user_dont_exist') || error.response?.data?.error || 'Failed to fetch user data');
	  return;
	}
  
	// Randomly shuffle players for first semi-final
	const shuffled = [...players].sort(() => Math.random() - 0.5);
	setCurrentMatch({
	  player1: shuffled[0].username,
	  player2: shuffled[1].username,
	  stage: 'semi-final-1',
	});
	setPlayer1Name(shuffled[0].username);
	setPlayer2Name(shuffled[1].username);
	setShowLogin(false);
	setShowMenu(true);
	console.log('Tournament started: Semi-Final 1', shuffled[0].username, 'vs', shuffled[1].username);
  };

  const handleMatchEnd = (winner: string, score: string) => {
    setWinners((prev) => [...prev, winner]);
    console.log(`Match ended: ${winner} won ${score}, stage: ${currentMatch?.stage}`);
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
  
    // Удаляем setTimeout, чтобы не переходить к следующему матчу автоматически
    setShowWinnerScreen(true); // Показываем экран результатов
    gameRunning.current = false;
    isGamePaused.current = true;
  };
  
  const handleRestart = () => {
    console.log('Restarting match or moving to next stage');
    setPlayer1Score(0);
    setPlayer2Score(0);
    setShowWinnerScreen(false);
    lastWallHit.current = null;
    gameRunning.current = false;
    isGamePaused.current = false;
    leftPaddleVelocity.current = 0;
    rightPaddleVelocity.current = 0;
  
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
  
    // Логика перехода к следующему матчу
    if (currentMatch?.stage === 'semi-final-1') {
      const remainingPlayers = players
        .filter((p) => p.username !== currentMatch.player1 && p.username !== currentMatch.player2)
        .map((p) => p.username);
      setCurrentMatch({
        player1: remainingPlayers[0],
        player2: remainingPlayers[1],
        stage: 'semi-final-2',
      });
      setPlayer1Name(remainingPlayers[0]);
      setPlayer2Name(remainingPlayers[1]);
      setShowMenu(true);
      console.log('Starting Semi-Final 2:', remainingPlayers[0], 'vs', remainingPlayers[1]);
    } else if (currentMatch?.stage === 'semi-final-2') {
      setCurrentMatch({
        player1: winners[0],
        player2: winners[1],
        stage: 'final',
      });
      setPlayer1Name(winners[0]);
      setPlayer2Name(winners[1]);
      setShowMenu(true);
      console.log('Starting Final:', winners[0], 'vs', winners[1]);
    } else if (currentMatch?.stage === 'final') {
      if (onTournamentEnd) {
        onTournamentEnd(winners[1]);
      }
      console.log('Tournament ended: Winner is', winners[1]);
      navigate('/profile');
    }
  };

  const applyScoreLimit = () => {
    const scoreInput = document.getElementById('scoreLimitInput') as HTMLInputElement;
    const value = parseInt(scoreInput.value);
    if (!isNaN(value) && value > 0 && value <= 100) {
      setMaxScore(value);
      setShowMenu(false);
      gameRunning.current = true;
      console.log(`Starting game with score limit: ${value}`);
    } else {
      toast.error(t('invalid_score_limit'));
    }
  };

  useEffect(() => {
    if (!canvasRef.current || showMenu || showLogin || showWinnerScreen) {
      console.log('Skipping game initialization: UI state active');
      return;
    }

    if (!gameRunning.current) {
      console.log('Game not running, exiting useEffect');
      return;
    }

    console.log(`Initializing game: ${player1Name} vs ${player2Name}`);
    const engine = new BABYLON.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    const scene = createScene(engine, canvasRef.current, input.current, {
      player1Score,
      setPlayer1Score,
      player2Score,
      setPlayer2Score,
      maxScore,
      setWinner: (winner: string) => {
        console.log(`Winner set: ${winner}`);
        setTimeout(() => {
          setWinnerText(`${winner} ${t('win')}`);
          setShowWinnerScreen(true);
          gameRunning.current = false;
          isGamePaused.current = true;
          handleMatchEnd(winner, `${player1Score}-${player2Score}`);
        }, 200);
      },
      lastWallHit,
      player1Name,
      player2Name,
    });

    const renderLoop = () => {
      if (showWinnerScreen || !gameRunning.current || isGamePaused.current) {
        console.log('Stopping render loop');
        engine.stopRenderLoop();
        return;
      }
      scene.render();
    };
    engine.runRenderLoop(renderLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 's', 'arrowup', 'arrowdown'].includes(key)) {
        e.preventDefault();
        input.current[key as keyof typeof input.current] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in input.current) {
        input.current[key as keyof typeof input.current] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      console.log('Cleaning up Babylon.js engine');
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (engineRef.current) {
        engineRef.current.stopRenderLoop();
        scene.onBeforeRenderObservable.clear();
        scene.dispose();
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [showMenu, showLogin, showWinnerScreen, player1Name, player2Name, maxScore, t]);

  const createScene = (
    engine: BABYLON.Engine,
    canvas: HTMLCanvasElement,
    input: { w: boolean; s: boolean; arrowup: boolean; arrowdown: boolean },
    state: {
      player1Score: number;
      setPlayer1Score: React.Dispatch<React.SetStateAction<number>>;
      player2Score: number;
      setPlayer2Score: React.Dispatch<React.SetStateAction<number>>;
      maxScore: number;
      setWinner: (winner: string) => void;
      lastWallHit: React.MutableRefObject<string | null>;
      player1Name: string;
      player2Name: string;
    }
  ): BABYLON.Scene => {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

    const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 0, -30), scene);
    camera.setTarget(BABYLON.Vector3.Zero());

    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

    const paddleWidth = 1,
      paddleHeight = 4;
    const leftPaddle = BABYLON.MeshBuilder.CreateBox('leftPaddle', { width: paddleWidth, height: paddleHeight, depth: 0.5 }, scene);
    leftPaddle.position.x = -13;

    const rightPaddle = BABYLON.MeshBuilder.CreateBox('rightPaddle', { width: paddleWidth, height: paddleHeight, depth: 0.5 }, scene);
    rightPaddle.position.x = 13;

    const ball = BABYLON.MeshBuilder.CreateSphere('ball', { diameter: 1 }, scene);
    let ballVelocity = new BABYLON.Vector3(0.4, 0, 0);

    const wallMaterial = new BABYLON.StandardMaterial('wallMat', scene);
    wallMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    const wallTop = BABYLON.MeshBuilder.CreateBox('wallTop', { width: 30, height: 0.3, depth: 0.5 }, scene);
    wallTop.position.y = 7.5;
    wallTop.material = wallMaterial;

    const wallBottom = BABYLON.MeshBuilder.CreateBox('wallBottom', { width: 30, height: 0.3, depth: 0.5 }, scene);
    wallBottom.position.y = -7.5;
    wallBottom.material = wallMaterial;

    const leftWall = BABYLON.MeshBuilder.CreateBox('leftWall', { width: 0.5, height: 14, depth: 1 }, scene);
    leftWall.position.x = -16.5;
    leftWall.material = wallMaterial;

    const rightWall = BABYLON.MeshBuilder.CreateBox('rightWall', { width: 0.5, height: 14, depth: 1 }, scene);
    rightWall.position.x = 16.5;
    rightWall.material = wallMaterial;

    for (let y = -7; y <= 7; y += 1.5) {
      const segment = BABYLON.MeshBuilder.CreateBox('segment', { width: 0.2, height: 0.6, depth: 0.1 }, scene);
      segment.position.x = 0;
      segment.position.y = y;
      segment.material = wallMaterial;
    }

    const checkCollision = (paddle: BABYLON.Mesh): boolean => {
      const paddleMinX = paddle.position.x - paddleWidth / 2;
      const paddleMaxX = paddle.position.x + paddleWidth / 2;
      const paddleMinY = paddle.position.y - paddleHeight / 2;
      const paddleMaxY = paddle.position.y + paddleHeight / 2;

      const ballMinX = ball.position.x - 0.5;
      const ballMaxX = ball.position.x + 0.5;
      const ballMinY = ball.position.y - 0.5;
      const ballMaxY = ball.position.y + 0.5;

      return ballMaxX >= paddleMinX && ballMinX <= paddleMaxX && ballMaxY >= paddleMinY && ballMinY <= paddleMaxY;
    };

    const reflectBall = (paddle: BABYLON.Mesh, isLeft: boolean, paddleVelocity: number) => {
      const deltaY = ball.position.y - paddle.position.y;
      const normalized = Math.max(-1, Math.min(1, deltaY / (paddleHeight / 2)));
      const maxAngle = Math.PI / 3;
      const angle = normalized * maxAngle * (Math.abs(normalized) > 0.8 ? 1.2 : 1);
      const baseSpeed = 0.4;
      const speed = baseSpeed + Math.abs(paddleVelocity) * 0.1;
      const dir = isLeft ? 1 : -1;
      ballVelocity.x = dir * speed * Math.cos(angle);
      ballVelocity.y = speed * Math.sin(angle);
    };

    const resetBall = () => {
      leftPaddle.position.y = 0;
      rightPaddle.position.y = 0;
      ball.position = new BABYLON.Vector3(0, 0, 0);
      const angle = Math.random() * (Math.PI / 36) - Math.PI / 72;
      const dir = Math.random() > 0.5 ? 1 : -1;
      const speed = 0.4;
      ballVelocity.x = dir * speed * Math.cos(angle);
      ballVelocity.y = speed * Math.sin(angle);
      state.lastWallHit.current = null;
    };

    scene.onBeforeRenderObservable.add(() => {
      if (isGamePaused.current || !gameRunning.current) return;

      const speed = 0.4;
      const yMin = -5;
      const yMax = 5;

      leftPaddleVelocity.current = 0;
      if (input.w && leftPaddle.position.y < yMax) {
        leftPaddle.position.y = Math.min(leftPaddle.position.y + speed, yMax);
        leftPaddleVelocity.current = speed;
      }
      if (input.s && leftPaddle.position.y > yMin) {
        leftPaddle.position.y = Math.max(leftPaddle.position.y - speed, yMin);
        leftPaddleVelocity.current = -speed;
      }
      rightPaddleVelocity.current = 0;
      if (input.arrowup && rightPaddle.position.y < yMax) {
        rightPaddle.position.y = Math.min(rightPaddle.position.y + speed, yMax);
        rightPaddleVelocity.current = speed;
      }
      if (input.arrowdown && rightPaddle.position.y > yMin) {
        rightPaddle.position.y = Math.max(rightPaddle.position.y - speed, yMin);
        rightPaddleVelocity.current = -speed;
      }

      ball.position.addInPlace(ballVelocity);

      if (ball.position.y >= 7 && state.lastWallHit.current !== 'top') {
        state.lastWallHit.current = 'top';
        ballVelocity.y = -Math.abs(ballVelocity.y);
        ballVelocity.y *= 0.95 + Math.random() * 0.1;
        ballVelocity.x *= 0.95 + Math.random() * 0.1;
        ball.position.y = 6.9;
      } else if (ball.position.y <= -7 && state.lastWallHit.current !== 'bottom') {
        state.lastWallHit.current = 'bottom';
        ballVelocity.y = Math.abs(ballVelocity.y);
        ballVelocity.y *= 0.95 + Math.random() * 0.1;
        ballVelocity.x *= 0.95 + Math.random() * 0.1;
        ball.position.y = -6.9;
      } else if (ball.position.y < 6.9 && ball.position.y > -6.9) {
        state.lastWallHit.current = null;
      }

      if (checkCollision(leftPaddle)) {
        reflectBall(leftPaddle, true, leftPaddleVelocity.current);
        state.lastWallHit.current = null;
      }
      if (checkCollision(rightPaddle)) {
        reflectBall(rightPaddle, false, rightPaddleVelocity.current);
        state.lastWallHit.current = null;
      }

      if (ball.position.x < -17) {
        state.setPlayer2Score((prev) => {
          const newScore = prev + 1;
          if (newScore >= state.maxScore) {
            state.setWinner(state.player2Name);
          }
          return newScore;
        });
        resetBall();
      }
      if (ball.position.x > 17) {
        state.setPlayer1Score((prev) => {
          const newScore = prev + 1;
          if (newScore >= state.maxScore) {
            state.setWinner(state.player1Name);
          }
          return newScore;
        });
        resetBall();
      }
    });

    return scene;
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      width: '100%',
      height: '100vh',
      margin: 0,
      overflow: 'hidden',
      background: 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
    },
    canvas: {
      width: '100%',
      height: '100%',
      display: 'block',
    },
    scoreboard: {
      position: 'absolute',
      top: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: '24px',
      zIndex: 1,
      display: showMenu || showLogin ? 'none' : 'block',
    },
    loginContainer: {
      backgroundColor: '#222',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '400px',
    },
    loginTitle: {
      color: '#fff',
      marginBottom: '20px',
      fontSize: '24px',
    },
    input: {
      width: '100%',
      padding: '10px',
      marginBottom: '15px',
      borderRadius: '6px',
      border: '1px solid #555',
      backgroundColor: '#333',
      color: '#fff',
      fontSize: '16px',
    },
    loginButton: {
      padding: '10px 20px',
      backgroundColor: '#4caf50',
      border: 'none',
      borderRadius: '6px',
      color: '#fff',
      fontWeight: 'bold',
      cursor: 'pointer',
    },
    error: {
      color: 'red',
      marginTop: '10px',
    },
    scoreLimitContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#222',
      color: '#eee',
      borderRadius: '12px',
      boxShadow: '0 6px 15px rgba(0,0,0,0.4)',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      textAlign: 'center',
      padding: '20px 30px',
      zIndex: 20,
    },
    scoreLimitLabel: {
      fontWeight: 600,
      marginRight: '10px',
      fontSize: '16px',
    },
    scoreLimitInput: {
      width: '60px',
      padding: '6px 10px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      marginRight: '10px',
      outline: 'none',
      color: 'black',
    },
    scoreLimitButton: {
      background: '#4caf50',
      border: 'none',
      color: 'black',
      padding: '7px 15px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 600,
      transition: 'background 0.3s ease',
      margin: '0 5px',
    },
    winnerScreen: {
      display: showWinnerScreen ? 'block' : 'none',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '30px 50px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      fontSize: '24px',
      borderRadius: '15px',
      boxShadow: '0 0 15px rgba(255,255,255,0.2)',
      textAlign: 'center',
      zIndex: 1000,
      fontFamily: "'Segoe UI', Arial, sans-serif",
    },
    winnerButton: {
      marginTop: '20px',
      padding: '10px 20px',
      fontSize: '18px',
      border: 'none',
      borderRadius: '10px',
      backgroundColor: '#4CAF50',
      color: 'white',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    disabledInput: {
      width: '100%',
      padding: '10px',
      marginBottom: '15px',
      borderRadius: '6px',
      border: '1px solid #555',
      backgroundColor: '#444',
      color: '#fff',
      fontSize: '16px',
      cursor: 'not-allowed',
    },
  };

  return (
    <div style={styles.container}>
      {showLogin ? (
        <div style={styles.loginContainer}>
          <h2 style={styles.loginTitle}>{t('tournament_login')}</h2>
          {/* Display site owner as Player 1 */}
          <div style={styles.disabledInput}>
            {t('player')} 1: {siteOwnerUsername}
          </div>
          {/* Input fields for Players 2, 3, 4 */}
          {players.slice(1).map((player) => (
            <input
              key={player.id}
              placeholder={`${t('player')} ${player.id}`}
              value={player.username}
              onChange={(e) => handlePlayerInput(player.id, e.target.value)}
              style={styles.input}
            />
          ))}
          <button onClick={handleLogin} style={styles.loginButton}>
            {t('start_tournament')}
          </button>
          {error && <p style={styles.error}>{error}</p>}
        </div>
      ) : (
        <>
          {showMenu && (
            <div style={styles.scoreLimitContainer}>
              <div style={{ fontSize: '20px', marginBottom: '15px' }}>
                {currentMatch?.stage === 'semi-final-1'
                  ? t('semi_final_1')
                  : currentMatch?.stage === 'semi-final-2'
                  ? t('semi_final_2')
                  : t('final')}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <span style={styles.scoreLimitLabel}>
                  {t('player1')}: {player1Name}
                </span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <span style={styles.scoreLimitLabel}>
                  {t('player2')}: {player2Name}
                </span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label htmlFor="scoreLimitInput" style={styles.scoreLimitLabel}>
                  {t('play_to')}
                </label>
                <input
                  type="number"
                  id="scoreLimitInput"
                  defaultValue={5}
                  min="1"
                  max="100"
                  step="1"
                  style={styles.scoreLimitInput}
                  aria-label="Set score limit"
                />
              </div>
              <button
                onClick={applyScoreLimit}
                style={styles.scoreLimitButton}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'white')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#4CAF50')}
                aria-label="Start game"
              >
                {t('start_game')}
              </button>
            </div>
          )}

		<div style={styles.winnerScreen}>
		<div>
			{currentMatch?.stage === 'final' ? t('tournament_winner') : t('match_winner')}: {winnerText}
		</div>
		<button
			onClick={handleRestart}
			style={styles.winnerButton}
			onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#45a049')}
			onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4CAF50')}
			aria-label={currentMatch?.stage === 'final' ? 'End tournament' : 'Next match'}
		>
			{currentMatch?.stage === 'final' ? t('end_tournament') : t('next_match')}
		</button>
		</div>

          <div style={styles.scoreboard}>
            {player1Name}: {player1Score} | {player2Name}: {player2Score}
          </div>

          <canvas
            id="renderCanvas"
            ref={canvasRef}
            style={styles.canvas}
            aria-label="Pong game canvas"
          />
        </>
      )}
    </div>
  );
};

export default SmartPong;
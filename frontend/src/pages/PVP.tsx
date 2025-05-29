import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as BABYLON from '@babylonjs/core';
import { getUser, getUserByUsername } from '../services/api';
import { UserResponse } from '../types/auth';
import { pvp } from '../services/api';
import { useTranslation } from 'react-i18next';

const SmartPong: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = useParams<{ username?: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const token = localStorage.getItem('token');
  const id = localStorage.getItem('id');
  const [user, setUser] = useState<UserResponse | null>(null);
  const [user2, setUser2] = useState<UserResponse | null>(null);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [maxScore, setMaxScore] = useState(5);
  const [player1Name, setPlayer1Name] = useState('Гость');
  const [player2Name, setPlayer2Name] = useState(location.state?.player2Name || null);
  const [showMenu, setShowMenu] = useState(true);
  const [showWinnerScreen, setShowWinnerScreen] = useState(false);
  const [winnerText, setWinnerText] = useState('');
  const input = useRef<{ w: boolean; s: boolean; arrowup: boolean; arrowdown: boolean }>({ w: false, s: false, arrowup: false, arrowdown: false });
  const lastWallHit = useRef<string | null>(null);
  const gameRunning = useRef(false);
  const isGamePaused = useRef(false);
  const leftPaddleVelocity = useRef(0);
  const rightPaddleVelocity = useRef(0);

  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { t, i18n } = useTranslation();

  
  const handleLogin = async () => {
    if (!token) {
      toast.error('Please log in to play');
      navigate('/login');
      return;
    }
    setError('User does not exist');
    if (!user)
      return;
    if (player2Name.trim()) {
      if (player2Name.trim() == user.username){
        setError('You cant write your login');
        return ;
      }
      setError('User does not exist');
      const userData2 = await getUserByUsername(token, player2Name);
      setUser2(userData2);
      if (userData2)
      {
        setError('');
        setIsLoggedIn(true);
        return ;
      }
    }
  };


  // Fetch authenticated user for player1Name
  useEffect(() => {
    

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
        } else {
          const userData = await getUser(token, id);
          setUser(userData);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to fetch user data');
        navigate('/login');
      }
    };
    if (user) {
      setPlayer1Name(user.username || 'Гость');
    }

    fetchUser();
  }, [navigate, token, id, username, user]);

  // Update player1Name when user is fetched

  // Обработчик установки лимита очков (Apply)
  const applyScoreOnly = () => {
    const scoreInput = document.getElementById('scoreLimitInput') as HTMLInputElement;
    const value = parseInt(scoreInput.value);
    if (!isNaN(value) && value > 0 && value <= 100) {
      setMaxScore(value);
    } else {
      toast.error('Please enter a valid score limit between 1 and 100.');
    }
  };

  // Обработчик старта игры (Start Game)
  const applyScoreLimit = () => {
    const scoreInput = document.getElementById('scoreLimitInput') as HTMLInputElement;
    const value = parseInt(scoreInput.value);
    if (!isNaN(value) && value > 0 && value <= 100) {
      setMaxScore(value);
      setShowMenu(false);
    } else {
      toast.error('Please enter a valid score limit between 1 and 100.');
    }
  };

  // Обработчик перезапуска игры (Play Again)
  const handleRestart = () => {
    setPlayer1Score(0);
    setPlayer2Score(0);
    setShowMenu(true);
    setShowWinnerScreen(false);
    lastWallHit.current = null;
    gameRunning.current = false;
    isGamePaused.current = false;
    leftPaddleVelocity.current = 0;
    rightPaddleVelocity.current = 0;
  };

  // Инициализация игры
  useEffect(() => {
    if (!canvasRef.current || showMenu) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = createScene(engine, canvasRef.current, input.current, {
      player1Score,
      setPlayer1Score,
      player2Score,
      setPlayer2Score,
      maxScore,
      setWinner: (winner: string) => {
        setTimeout(() => {
          if (!token || !user2)
            return;
          // console
          pvp(token, user2.id, true);
          setWinnerText(`${winner} ${t('win')}`);
          setShowWinnerScreen(true);
          gameRunning.current = false;
        }, 200);
        isGamePaused.current = true;
      },
      lastWallHit,
      player1Name,
      player2Name,
    });

    gameRunning.current = true;
    engine.runRenderLoop(() => {
      if (showWinnerScreen || !gameRunning.current) {
        engine.stopRenderLoop();
        return;
      }
      scene.render();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 's', 'arrowup', 'arrowdown'].includes(key)) {
        e.preventDefault(); // Prevent scrolling
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
      engine.stopRenderLoop();
      scene.onBeforeRenderObservable.clear();
      engine.dispose();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [showMenu, showWinnerScreen, player1Name, player2Name]);

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
  ) => {
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

    const checkCollision = (paddle: BABYLON.Mesh) => {
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
      if (isGamePaused.current || !gameRunning.current) {
        return;
      }

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
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      color: 'black',
      fontFamily: 'monospace',
      fontSize: '24px',
      zIndex: 1,
      display: showMenu ? 'none' : 'block',
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
    scoreLimitButtonHover: {
      background: '#45a049',
    },
    scoreLimitDisplay: {
      marginLeft: '15px',
      fontSize: '16px',
      fontWeight: 600,
      verticalAlign: 'middle',
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
    loginContainer: {
      backgroundColor: '#222',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '300px',
    },
    loginTitle: {
      color: '#fff',
      marginBottom: '20px',
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
  };

  return (
      <div style={styles.container}>
        {!isLoggedIn ? (
          <div style={styles.loginContainer}>
            <h2 style={styles.loginTitle}>Вход</h2>
            <input
              placeholder={t('login')}
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleLogin} style={styles.loginButton}>
              {t('log_in')}
            </button>
            {error && <p style={styles.error}>{error}</p>}
          </div>
        ) : (
          <>
            {showMenu && (
              <div id="scoreLimitContainer" style={styles.scoreLimitContainer}>
                <div style={{ fontSize: '20px', marginBottom: '15px' }}>{t('game_set')}</div>
                <div style={{ marginBottom: '10px' }}>
                  <span style={styles.scoreLimitLabel}>{t('player')} 1: {player1Name}</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <span style={styles.scoreLimitLabel}>{t('player')} 2: {player2Name}</span>
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
                  onClick={applyScoreOnly}
                  style={styles.scoreLimitButton}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#45a049')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#4caf50')}
                  aria-label="Apply score limit"
                >
                  {t('apply')}
                </button>
                <button
                  onClick={applyScoreLimit}
                  style={styles.scoreLimitButton}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#45a049')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#4caf50')}
                  aria-label="Start game"
                >
                  {t('start_game')}
                </button>
                <span id="scoreLimitDisplay" style={styles.scoreLimitDisplay}>
                {t('curr_lim')} {maxScore}
                </span>
              </div>
            )}

            <div id="winnerScreen" style={styles.winnerScreen}>
              <div id="winnerText">{winnerText}</div>
              <button
                id="restartButton"
                onClick={handleRestart}
                style={styles.winnerButton}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45a049')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#4CAF50')}
                aria-label="Play again"
              >
                {t('play_again')}
              </button>
            </div>

            <div id="scoreboard" style={styles.scoreboard}>
              {player1Name}: {player1Score} | {player2Name}: {player2Score}
            </div>

            <canvas id="renderCanvas" ref={canvasRef} style={styles.canvas} aria-label="Pong game canvas" />
          </>
        )}
      </div>
  );
};

export default SmartPong;

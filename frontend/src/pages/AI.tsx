import React, { useEffect, useRef, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUser, getUserByUsername, addFriend, blockUser } from '../services/api';
import { UserResponse } from '../types/auth';
import { useTranslation } from 'react-i18next';


import * as BABYLON from '@babylonjs/core';

const SmartPong: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const navigate = useNavigate();
  const { username } = useParams<{ username?: string }>();
  const [user, setUser] = useState<UserResponse | null>(null);
  // const [status, setStatus] = useState<string>('');
  const token = localStorage.getItem('token');
  const id = localStorage.getItem('id');

  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [maxScore, setMaxScore] = useState(5);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(true);
  const [showScoreLimitContainer, setShowScoreLimitContainer] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const { t, i18n } = useTranslation();


  // Настройки сложности AI
  const difficultySettings: { [key: string]: { randomness: number; reactionDelay: number } } = {
    easy: { randomness: 3, reactionDelay: 1500 },
    medium: { randomness: 1.5, reactionDelay: 1000 },
    hard: { randomness: 0.5, reactionDelay: 600 },
  };

  // Обработчик выбора сложности
  const handleDifficultySelect = (diff: string) => {
    setDifficulty(diff);
    setShowDifficultyMenu(false);
    setShowScoreLimitContainer(false);
  };

  // Обработчик установки лимита очков
  const applyScoreLimit = () => {
    const input = document.getElementById('scoreLimitInput') as HTMLInputElement;
    const value = parseInt(input.value);
    if (!isNaN(value) && value > 0 && value <= 100) {
      setMaxScore(value);
    } else {
      alert('Пожалуйста, введите допустимый лимит очков от 1 до 100.');
    }
  };

  // Обработчик перезапуска игры
  const handleRestart = () => {
    setPlayerScore(0);
    setAiScore(0);
    setWinner(null);
    setShowDifficultyMenu(true);
    setShowScoreLimitContainer(true);
    setDifficulty(null); // Reset difficulty to trigger useEffect cleanup
  };

  useEffect(() => {


    const fetchUser = async () => {
      if (!token || !id) {
        toast.error('Please log in to view your profile');
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

    fetchUser();





    if (!canvasRef.current || !difficulty) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = createScene(engine, canvasRef.current);
    engine.runRenderLoop(() => {
      if (winner) {
        console.log('Winner detected, stopping render loop:', winner);
        engine.stopRenderLoop();
        return;
      }
      scene.render();
    });

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      console.log('Cleaning up useEffect: stopping render loop and disposing engine');
      engine.stopRenderLoop();
      engine.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [difficulty, winner, navigate]); // Add winner to dependencies to recheck render loop

  const createScene = (engine: BABYLON.Engine, canvas: HTMLCanvasElement) => {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

    const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 25, -30), scene);
    camera.setTarget(new BABYLON.Vector3(0, 0, 0));
    camera.rotation.x = Math.PI / 4;

    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1;

    const paddleWidth = 4,
      paddleHeight = 1;

    const player = BABYLON.MeshBuilder.CreateBox('player', { width: paddleWidth, height: paddleHeight, depth: 1 }, scene);
    player.position.z = -15;
    player.position.y = 0.5;
    const playerMat = new BABYLON.StandardMaterial('blue', scene);
    playerMat.diffuseColor = new BABYLON.Color3(0.1, 0.3, 1);
    player.material = playerMat;

    const ai = BABYLON.MeshBuilder.CreateBox('ai', { width: paddleWidth, height: paddleHeight, depth: 1 }, scene);
    ai.position.z = 15;
    ai.position.y = 0.5;
    const aiMat = new BABYLON.StandardMaterial('red', scene);
    aiMat.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
    ai.material = aiMat;

    const ball = BABYLON.MeshBuilder.CreateSphere('ball', { diameter: 1 }, scene);
    ball.position.y = 0.5;

    let ballSpeed = 0.4;
    let ballVelocity = new BABYLON.Vector3(0, 0, ballSpeed * (Math.random() > 0.5 ? 1 : -1));

    const speedMultiplier = 1.05;
    const maxBallSpeed = 0.6;

    const groundWidth = 22;
    const groundHeight = 35;
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: groundWidth, height: groundHeight }, scene);
    const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.2);
    ground.material = groundMat;

    const stripeWidth = 1.5;
    const stripeHeight = 0.1;
    const stripeDepth = 0.5;
    const stripeCount = 12;
    const stripeSpacing = 2;

    for (let i = 0; i < stripeCount; i++) {
      const stripe = BABYLON.MeshBuilder.CreateBox(`stripe${i}`, { width: stripeWidth, height: stripeHeight, depth: stripeDepth }, scene);
      stripe.position.x = 5.2 + (-groundHeight / 2 + stripeDepth / 2 + i * stripeSpacing);
      stripe.position.y = 0.01;
      stripe.position.z = 0;
      const stripeMat = new BABYLON.StandardMaterial(`stripeMat${i}`, scene);
      stripeMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
      stripe.material = stripeMat;
    }

    const wallThickness = 1;
    const wallHeight = 2;

    const leftWall = BABYLON.MeshBuilder.CreateBox('leftWall', { width: wallThickness, height: wallHeight, depth: groundHeight }, scene);
    leftWall.position.x = -groundWidth / 2 - wallThickness / 2;
    leftWall.position.y = wallHeight / 2;
    leftWall.position.z = 0;
    const leftWallMat = new BABYLON.StandardMaterial('wallMat', scene);
    leftWallMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    leftWall.material = leftWallMat;

    const rightWall = BABYLON.MeshBuilder.CreateBox('rightWall', { width: wallThickness, height: wallHeight, depth: groundHeight }, scene);
    rightWall.position.x = groundWidth / 2 + wallThickness / 2;
    rightWall.position.y = wallHeight / 2;
    rightWall.position.z = 0;
    const rightWallMat = new BABYLON.StandardMaterial('wallMat2', scene);
    rightWallMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    rightWall.material = rightWallMat;

    const input = { a: false, d: false };
    window.addEventListener('keydown', (e) => {
      if (e.key === 'a' || e.key === 'ArrowLeft') input.a = true;
      if (e.key === 'd' || e.key === 'ArrowRight') input.d = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'a' || e.key === 'ArrowLeft') input.a = false;
      if (e.key === 'd' || e.key === 'ArrowRight') input.d = false;
    });

    const paddleHit = (paddle: BABYLON.Mesh) => {
      return Math.abs(ball.position.z - paddle.position.z) < 1 && Math.abs(ball.position.x - paddle.position.x) < paddleWidth / 2 + 0.5;
    };

    const reflectBall = (paddle: BABYLON.Mesh) => {
      let relativeIntersectX = (ball.position.x - paddle.position.x) / (paddleWidth / 2);
      relativeIntersectX = Math.min(Math.max(relativeIntersectX, -1), 1);

      const maxBounceAngle = (Math.PI * 75) / 180;
      let bounceAngle = relativeIntersectX * maxBounceAngle;

      let speed = ballVelocity.length();
      let directionZ = paddle.position.z < 0 ? 1 : -1;

      speed = Math.min(speed * speedMultiplier, maxBallSpeed);

      ballVelocity.x = speed * Math.sin(bounceAngle);
      ballVelocity.z = speed * Math.cos(bounceAngle) * directionZ;
    };

    const resetBall = () => {
      player.position.x = 0;
      ai.position.x = 0;
      aiTargetX = 0;
      ball.position = new BABYLON.Vector3(0, 0.5, 0);
      ballVelocity = new BABYLON.Vector3(0, 0, ballSpeed * (Math.random() > 0.5 ? 1 : -1));
    };

    let baseMoveSpeed = 20;
    let aiTargetX = 0;
    let lastPredictionTime = 0;

    const predictBallPosition = () => {
      if (!difficulty) return;
      const { randomness, reactionDelay } = difficultySettings[difficulty];

      const now = performance.now();
      if (now - lastPredictionTime < reactionDelay) return;
      lastPredictionTime = now;

      if (ballVelocity.z > 0) {
        let prediction = ball.position.clone();
        let predictedVel = ballVelocity.clone();
        let steps = 0;
        const maxSteps = 1000;

        while (prediction.z < ai.position.z && steps++ < maxSteps) {
          prediction.addInPlace(predictedVel);
          if (prediction.x <= -groundWidth / 2 + 0.5 || prediction.x >= groundWidth / 2 - 0.5) {
            predictedVel.x *= -1;
          }
        }

        aiTargetX = prediction.x + (Math.random() - 0.5) * randomness;
      } else {
        aiTargetX = ai.position.x;
      }
    };

    const moveTowards = (current: number, target: number, maxDelta: number) => {
      const delta = target - current;
      if (Math.abs(delta) <= maxDelta) return target;
      return current + Math.sign(delta) * maxDelta;
    };

    scene.onBeforeRenderObservable.add(() => {
      // Stop all game logic if a winner is determined
      if (winner) {
        console.log('Winner detected in onBeforeRenderObservable, stopping game loop:', winner);
        engine.stopRenderLoop();
        return;
      }

      const dt = engine.getDeltaTime() / 1000;

      const moveSpeed = baseMoveSpeed;
      const aiMoveSpeed = baseMoveSpeed;

      if (input.a && player.position.x > -groundWidth / 2 + 1) player.position.x -= moveSpeed * dt;
      if (input.d && player.position.x < groundWidth / 2 - 1) player.position.x += moveSpeed * dt;

      predictBallPosition();
      // ai.position.x = moveTowards(ai.position.x, aiTargetX, aiMoveSpeed * dt);
      const newAiX = moveTowards(ai.position.x, aiTargetX, aiMoveSpeed * dt);
      if (newAiX > -groundWidth / 2 + 1 && newAiX < groundWidth / 2 - 1) {
        ai.position.x = newAiX;
      }

      ball.position.addInPlace(ballVelocity);

      const leftLimit = -groundWidth / 2 + 0.5;
      const rightLimit = groundWidth / 2 - 0.5;
      if (ball.position.x <= leftLimit && ballVelocity.x < 0) {
        ballVelocity.x *= -1;
        ball.position.x = leftLimit;
      }
      if (ball.position.x >= rightLimit && ballVelocity.x > 0) {
        ballVelocity.x *= -1;
        ball.position.x = rightLimit;
      }

      if (paddleHit(player) && ballVelocity.z < 0) {
        reflectBall(player);
      }
      if (paddleHit(ai) && ballVelocity.z > 0) {
        reflectBall(ai);
      }

      // Only update scores if no winner is set
      if (!winner) {
        if (ball.position.z < player.position.z - 3) {
          setAiScore((prev) => {
            const newScore = prev + 1;
            console.log('AI Score:', newScore, 'Max Score:', maxScore);
            if (newScore >= maxScore) {
              setWinner('AI');
              return newScore;
            }
            resetBall();
            return newScore;
          });
        } else if (ball.position.z > ai.position.z + 3) {
          setPlayerScore((prev) => {
            const newScore = prev + 1;
            console.log('Player Score:', newScore, 'Max Score:', maxScore);
            if (newScore >= maxScore) {
              setWinner(user?.username || 'Гость');
              return newScore;
            }
            resetBall();
            return newScore;
          });
        }
      }
    });

    return scene;
  };

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, overflow: 'hidden', background: 'black' }}>
      {showDifficultyMenu && (
        <div
          id="difficultyMenu"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#222',
            color: 'white',
            fontFamily: 'monospace',
            padding: '20px 30px',
            borderRadius: '8px',
            textAlign: 'center',
            zIndex: 20,
          }}
        >
          <div>{t('dif')}</div>
          <button
            style={buttonStyle}
            onClick={() => handleDifficultySelect('easy')}
          >
            {t('easy')}
          </button>
          <button
            style={buttonStyle}
            onClick={() => handleDifficultySelect('medium')}
          >
            {t('normal')}
          </button>
          <button
            style={buttonStyle}
            onClick={() => handleDifficultySelect('hard')}
          >
            {t('hard')}
          </button>
        </div>
      )}
      {showScoreLimitContainer && (
        <div
          id="scoreLimitContainer"
          style={{
            margin: '20px auto',
            padding: '15px 25px',
            width: 'fit-content',
            background: '#222',
            color: '#eee',
            borderRadius: '12px',
            boxShadow: '0 6px 15px rgba(0,0,0,0.4)',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            textAlign: 'center',
            position: 'absolute',
            top: '65%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
          }}
        >
          <label
            htmlFor="scoreLimitInput"
            style={{ fontWeight: 600, marginRight: '10px', fontSize: '16px' }}
          >
            {t('play_to')}
          </label>
          <input
            type="number"
            id="scoreLimitInput"
            defaultValue={5}
            min={1}
            max={100}
            step={1}
            style={{
              width: '60px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              marginRight: '10px',
              outline: 'none',
              color: 'black',
            }}
          />
          <button
            onClick={applyScoreLimit}
            style={{
              background: '#4caf50',
              border: 'none',
              color: 'white',
              padding: '7px 15px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'background 0.3s ease',
            }}
          >
            {t('apply')}
          </button>
          <span
            id="scoreLimitDisplay"
            style={{
              marginLeft: '15px',
              fontSize: '16px',
              fontWeight: 600,
              verticalAlign: 'middle',
            }}
          >
            {t('curr_lim')} {maxScore}
          </span>
        </div>
      )}
      {winner && (
        <div
          id="winnerScreen"
          style={{
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
          }}
        >
          <div id="winnerText">{winner} {t('win')}</div>
          <button
            id="restartButton"
            onClick={handleRestart}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '18px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: '#4CAF50',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {t('play_again')}
          </button>
        </div>
      )}
      <div
        id="scoreboard"
        style={{
          position: 'absolute',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '24px',
          zIndex: 10,
          display: showDifficultyMenu ? 'none' : 'block',
        }}
      >
        {user?.username || "Guest"}: {playerScore} | AI: {aiScore}
      </div>
      <div
        id="winnerMessage"
        style={{
          marginTop: '10px',
          fontWeight: 700,
          fontSize: '18px',
          color: '#ffcc00',
          textAlign: 'center',
        }}
      ></div>
      <canvas
        id="renderCanvas"
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  fontSize: '18px',
  margin: '10px',
  padding: '8px 20px',
  cursor: 'pointer',
  border: 'none',
  borderRadius: '4px',
  background: '#555',
  color: 'white',
  transition: 'background-color 0.3s',
};

export default SmartPong;
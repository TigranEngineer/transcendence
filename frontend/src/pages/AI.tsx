
import React, { useEffect, useRef, useState } from 'react';

// Типизация для TypeScript
declare global {
  interface Window {
    BABYLON: any;
  }
}

const BABYLON = window.BABYLON!;

export default function SmartPong() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);

  // Игровые объекты
  const playerRef = useRef<any>(null);
  const aiRef = useRef<any>(null);
  const ballRef = useRef<any>(null);

  // Скорость мяча
  const ballVelocity = useRef(new BABYLON.Vector3(0.4, 0, 0.4));

  // AI цель по X
  const aiTargetX = useRef(0);

  // Для контроля AI времени реакции
  const lastAiMoveTime = useRef(0);

  // Для контроля нажатий клавиш
  const input = useRef({ left: false, right: false });

  // Состояния React
  const [difficulty, setDifficulty] = useState<string | null>(null); // easy, medium, hard
  const [maxScore, setMaxScore] = useState(5);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [scoreInput, setScoreInput] = useState("5");

  // Размеры поля и ракеток
  const groundWidth = 22;
  const groundHeight = 35;
  const paddleWidth = 4;
  const paddleHeight = 1;

  // Настройки по сложности
  const difficultySettings = {
    easy: { randomness: 3, reactionDelay: 1500 },
    medium: { randomness: 1.5, reactionDelay: 1000 },
    hard: { randomness: 0.5, reactionDelay: 600 },
  };

  // Инициализация сцены и объектов Babylon.js
  useEffect(() => {
    if (!difficulty) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    engineRef.current = engine;

    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new BABYLON.Color3.Black();

    // Камера
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 25, -30), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.rotation.x = Math.PI / 4;

    // Свет
    new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Поле (земля)
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: groundWidth, height: groundHeight }, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.1);
    ground.material = groundMat;

    // Ракетки игрока и AI
    const player = BABYLON.MeshBuilder.CreateBox("player", { width: paddleWidth, height: paddleHeight, depth: 1 }, scene);
    playerRef.current = player;
    player.position.z = -15;
    player.position.y = 0.5;
    const playerMat = new BABYLON.StandardMaterial("playerMat", scene);
    playerMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 1);
    player.material = playerMat;

    const ai = BABYLON.MeshBuilder.CreateBox("ai", { width: paddleWidth, height: paddleHeight, depth: 1 }, scene);
    aiRef.current = ai;
    ai.position.z = 15;
    ai.position.y = 0.5;
    const aiMat = new BABYLON.StandardMaterial("aiMat", scene);
    aiMat.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
    ai.material = aiMat;

    // Мяч
    const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 1 }, scene);
    ballRef.current = ball;
    ball.position.y = 0.5;

    // Начальная скорость мяча — в случайном направлении по Z
    const initialSpeed = 0.4;
    ballVelocity.current = new BABYLON.Vector3(0.2 * (Math.random() > 0.5 ? 1 : -1), 0, initialSpeed * (Math.random() > 0.5 ? 1 : -1));

    // Обработчики нажатий клавиш
    const keyDown = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "ArrowLeft") input.current.left = true;
      if (e.key === "d" || e.key === "ArrowRight") input.current.right = true;
    };

    const keyUp = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "ArrowLeft") input.current.left = false;
      if (e.key === "d" || e.key === "ArrowRight") input.current.right = false;
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    // Функция проверки попадания мяча по ракетке
    const isHit = (paddle: any) => {
      if (!ballRef.current || !paddle) return false;
      return (
        Math.abs(ballRef.current.position.z - paddle.position.z) < 1 &&
        Math.abs(ballRef.current.position.x - paddle.position.x) < paddleWidth / 2 + 0.5
      );
    };

    // Отражение мяча от ракетки с учетом угла
    const reflectBall = (paddle: any) => {
      if (!ballRef.current || !paddle) return;
      const relativeIntersectX = (ballRef.current.position.x - paddle.position.x) / (paddleWidth / 2);
      const maxBounceAngle = (Math.PI * 75) / 180; // 75 градусов в радианах
      const bounceAngle = relativeIntersectX * maxBounceAngle;
      const speed = ballVelocity.current.length() * 1.05; // немного ускоряем мяч при каждом отражении
      const directionZ = paddle.position.z < 0 ? 1 : -1;
      ballVelocity.current.x = speed * Math.sin(bounceAngle);
      ballVelocity.current.z = speed * Math.cos(bounceAngle) * directionZ;
    };

    // Сброс мяча и ракеток после очка
    const resetPositions = () => {
      if (playerRef.current && aiRef.current && ballRef.current) {
        playerRef.current.position.x = 0;
        aiRef.current.position.x = 0;
        ballRef.current.position = new BABYLON.Vector3(0, 0.5, 0);
        ballVelocity.current = new BABYLON.Vector3(0.2 * (Math.random() > 0.5 ? 1 : -1), 0, initialSpeed * (Math.random() > 0.5 ? 1 : -1));
        lastAiMoveTime.current = performance.now();
      }
    };

    // Обновление позиции AI
    const updateAi = (delta: number) => {
      if (!aiRef.current || !ballRef.current || !difficulty) return;
      const settings = difficultySettings[difficulty as keyof typeof difficultySettings];
      const now = performance.now();

      if (ballVelocity.current.z > 0) {
        // Мяч движется в сторону AI
        if (now - lastAiMoveTime.current > settings.reactionDelay) {
          lastAiMoveTime.current = now;
          // Предсказание позиции мяча
          let predictedX = ballRef.current.position.x;
          let predictedVelX = ballVelocity.current.x;
          let predictedPosZ = ballRef.current.position.z;
          let predictedVelZ = ballVelocity.current.z;

          while (predictedPosZ < aiRef.current.position.z) {
            predictedX += predictedVelX * delta;
            predictedPosZ += predictedVelZ * delta;
            if (predictedX > groundWidth / 2) {
              predictedX = groundWidth - predictedX;
              predictedVelX = -predictedVelX;
            } else if (predictedX < -groundWidth / 2) {
              predictedX = -groundWidth - predictedX;
              predictedVelX = -predictedVelX;
            }
          }

          // Добавляем шум
          const noise = (Math.random() - 0.5) * settings.randomness;
          aiTargetX.current = Math.min(Math.max(predictedX + noise, -groundWidth / 2 + paddleWidth / 2), groundWidth / 2 - paddleWidth / 2);
        }

        // Двигаем AI
        const diffX = aiTargetX.current - aiRef.current.position.x;
        const aiSpeed = 12;
        if (Math.abs(diffX) > 0.1) {
          aiRef.current.position.x += Math.sign(diffX) * aiSpeed * delta;
          aiRef.current.position.x = Math.min(Math.max(aiRef.current.position.x, -groundWidth / 2 + paddleWidth / 2), groundWidth / 2 - paddleWidth / 2);
        }
      } else {
        // Мяч в сторону игрока
        const diffX = 0 - aiRef.current.position.x;
        const aiSpeed = 12;
        if (Math.abs(diffX) > 0.1) {
          aiRef.current.position.x += Math.sign(diffX) * aiSpeed * delta;
        }
      }
    };

    // Главный игровой цикл
    scene.onBeforeRenderObservable.add(() => {
      if (gameOver || !ballRef.current || !playerRef.current || !aiRef.current) return;

      const delta = engine.getDeltaTime() / 1000; // в секундах

      // Движение игрока
      const playerSpeed = 15;
      if (input.current.left) playerRef.current.position.x -= playerSpeed * delta;
      if (input.current.right) playerRef.current.position.x += playerSpeed * delta;

      // Ограничиваем игрока
      playerRef.current.position.x = Math.min(Math.max(playerRef.current.position.x, -groundWidth / 2 + paddleWidth / 2), groundWidth / 2 - paddleWidth / 2);

      // Движение мяча
      ballRef.current.position.addInPlace(ballVelocity.current);

      // Отражение от стен
      if (ballRef.current.position.x > groundWidth / 2 || ballRef.current.position.x < -groundWidth / 2) {
        ballVelocity.current.x = -ballVelocity.current.x;
        ballRef.current.position.x = Math.min(Math.max(ballRef.current.position.x, -groundWidth / 2), groundWidth / 2);
      }

      // Проверка попадания в ракетки
      if (isHit(playerRef.current) && ballVelocity.current.z < 0) {
        reflectBall(playerRef.current);
      } else if (isHit(aiRef.current) && ballVelocity.current.z > 0) {
        reflectBall(aiRef.current);
      }

      // Проверка очков
      if (ballRef.current.position.z < -groundHeight / 2) {
        // Очко AI
        setAiScore((score) => {
          const newScore = score + 1;
          if (newScore >= maxScore) {
            setGameOver(true);
          } else {
            resetPositions();
          }
          return newScore;
        });
      } else if (ballRef.current.position.z > groundHeight / 2) {
        // Очко игрока
        setPlayerScore((score) => {
          const newScore = score + 1;
          if (newScore >= maxScore) {
            setGameOver(true);
          } else {
            resetPositions();
          }
          return newScore;
        });
      }

      // Обновляем AI
      updateAi(delta);
    });

    // Запуск рендера
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Очистка
    return () => {
      engine.stopRenderLoop();
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      scene.dispose();
      engine.dispose();
    };
  }, [difficulty, maxScore, gameOver]);

  // Сброс игры
  const restartGame = () => {
    setPlayerScore(0);
    setAiScore(0);
    setGameOver(false);
    aiTargetX.current = 0;
  };

  if (!difficulty) {
    // Меню выбора сложности и очков
    return (
      <div style={{ textAlign: "center", marginTop: 30, color: "#eee", fontFamily: "Arial" }}>
        <h1>Smart Pong</h1>
        <div>
          <label>
            Выберите сложность:
            <select onChange={(e) => setDifficulty(e.target.value)} defaultValue="">
              <option value="" disabled>
                Выберите...
              </option>
              <option value="easy">Легко</option>
              <option value="medium">Средне</option>
              <option value="hard">Сложно</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop: 15 }}>
          <label>
            Очки до победы:
            <input
              type="number"
              min="1"
              max="20"
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              onBlur={() => {
                const val = parseInt(scoreInput);
                if (!isNaN(val) && val > 0 && val <= 20) {
                  setMaxScore(val);
                } else {
                  setScoreInput(String(maxScore));
                }
              }}
              style={{ marginLeft: 10, width: 50 }}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", textAlign: "center", userSelect: "none" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100vw", height: "80vh", backgroundColor: "black", display: "block", margin: "auto" }}
      ></canvas>
      <div
        style={{
          color: "white",
          fontSize: 24,
          position: "absolute",
          top: 10,
          left: 10,
          fontFamily: "Arial",
        }}
      >
        Игрок: {playerScore} — AI: {aiScore}
      </div>

      {gameOver && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0,0,0,0.8)",
            padding: 30,
            borderRadius: 10,
            color: "white",
            fontFamily: "Arial",
          }}
        >
          <h2>{playerScore > aiScore ? "Вы выиграли!" : "AI выиграл!"}</h2>
          <button
            onClick={() => {
              restartGame();
            }}
            style={{
              marginTop: 15,
              padding: "10px 20px",
              fontSize: 16,
              cursor: "pointer",
              borderRadius: 5,
              border: "none",
              backgroundColor: "#2196F3",
              color: "white",
            }}
          >
            Играть заново
          </button>
        </div>
      )}
    </div>
  );
}

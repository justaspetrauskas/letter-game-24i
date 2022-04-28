import { createContext, useState, useEffect } from "react";
import { GameContextType, GameStats } from "../@types/gameStats";

export const GameInfoContext = createContext<GameContextType | null>(null);

interface GameInfoProviderProps {
  children?: React.ReactNode;
}

const GameInfoProvider: React.FC<GameInfoProviderProps> = ({ children }) => {
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    deadPieces: 0,
    totalPieces: 0,
    gameStatus: "playing",
    currentLevel: 1,
  });

  const [isRunning, setIsRunning] = useState<boolean>(true);

  const { totalPieces, gameStatus, deadPieces, currentLevel } = gameStats;

  useEffect(() => {
    if (isRunning) {
      if (deadPieces >= 20) {
        setGameStats({ ...gameStats, gameStatus: "finished" });
        setIsRunning(false);
      }
    }
  }, [isRunning, gameStats, gameStats.deadPieces, deadPieces]);

  useEffect(() => {
    if (
      isRunning &&
      totalPieces > 0 &&
      totalPieces % 20 === 0 &&
      currentLevel <= 6
    ) {
      setGameStats({ ...gameStats, currentLevel: currentLevel + 1 });
    }
  }, [totalPieces, isRunning]);

  const increaseScore = () => {
    setGameStats({ ...gameStats, score: gameStats.score + 1 });
  };

  const increaseDeadPiecs = () => {
    setGameStats({ ...gameStats, deadPieces: gameStats.deadPieces + 1 });
  };

  const increaseTotalPieces = () => {
    setGameStats({ ...gameStats, totalPieces: gameStats.totalPieces + 1 });
  };

  const pauseTheGame = () => {
    if (gameStats.gameStatus !== "finished") {
      if (gameStats.gameStatus === "playing")
        setGameStats({ ...gameStats, gameStatus: "paused" });
      if (gameStats.gameStatus === "paused")
        setGameStats({ ...gameStats, gameStatus: "playing" });
    }
  };

  const changeLevel = (level: number) => {
    console.log(level);
    setGameStats({ ...gameStats, currentLevel: level });
  };

  const reset = () => {
    setGameStats({
      score: 0,
      deadPieces: 0,
      totalPieces: 0,
      gameStatus: "playing",
      currentLevel: 1,
    });
    setIsRunning(true);
  };

  return (
    <GameInfoContext.Provider
      value={{
        gameStats,
        increaseDeadPiecs,
        increaseScore,
        reset,
        increaseTotalPieces,
        pauseTheGame,
        changeLevel,
      }}
    >
      {children}
    </GameInfoContext.Provider>
  );
};

export default GameInfoProvider;

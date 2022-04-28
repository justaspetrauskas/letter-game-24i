export interface GameStats {
  score: number;
  deadPieces: number;
  totalPieces: number;
  gameStatus: "playing" | "paused" | "finished";
  currentLevel: number;
  //   objectCount: number;
  //   level: number;
}

export type GameContextType = {
  gameStats: GameStats;
  increaseTotalPieces: () => void;
  increaseScore: () => void;
  increaseDeadPiecs: () => void;
  reset: () => void;
  pauseTheGame: () => void;
  //pause: () => void;
  //   updateStats: (statKey: "score" | "objectCount" | "level") => void;
  changeLevel: (level: number) => void;
};

import React, { useContext } from "react";

import { GameContextType } from "../../@types/gameStats";
import { GameInfoContext } from "../../context/GameInfoContext";

import StatField from "./StatField";

const levels = [1, 2, 3, 4, 5];

const GameOptions = () => {
  const { gameStats, pauseTheGame, changeLevel } = useContext(
    GameInfoContext
  ) as GameContextType;

  const handlePause = () => {
    pauseTheGame();
  };

  const { score, deadPieces, totalPieces, currentLevel, gameStatus } =
    gameStats;
  return (
    <div className="border-l w-full px-4 py-2">
      <div className=" flex flex-col items-center px-2 space-y-4 text-xl">
        <StatField title="Your Score" stat={score} />
        {/* dead Pieces */}
        <StatField title="Dead Pieces" stat={deadPieces} />
        {/*totalPieces */}
        <StatField title="Total Pieces" stat={totalPieces} />

        {/* controls */}
        <div className="p-4  w-full flex rounded-md border flex-row items-center justify-center font-bold text-white">
          <button
            className="px-6 py-4 rounded-lg bg-green-400 hover:bg-green-800 transition-colors duration-300"
            onClick={handlePause}
          >
            {gameStatus === "paused" ? "Resume" : "Pause"}
          </button>
        </div>

        <div className="p-4  w-full flex rounded-md border flex-col items-center justify-between font-bold">
          <h1>Level</h1>
          <div className="flex flex-row space-x-2 items-center mt-4">
            {levels.map((level, index) => (
              <span
                className={` p-4 border rounded-lg flex flex-row items-center justify-center transition-all duration-300 cursor-pointer ${
                  level === currentLevel
                    ? "text-3xl bg-green-400 text-white w-12 h-12"
                    : "text-xl w-10 h-10"
                }`}
                onClick={() => changeLevel(level)}
                key={index}
              >
                {level}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOptions;

import React from "react";
interface FinishedGameScreenProps {
  restart: () => void;
}
const FinishedGameScreen: React.FC<FinishedGameScreenProps> = ({ restart }) => {
  return (
    <div className="absolute bg-black/75 w-[calc(100vw*0.8)] top-0 left-0 h-full transition-all flex items-center justify-center">
      <button
        className="px-3 py-2 bg-slate-50 hover:bg-slate-400 transition-colors duration-300 hover:text-white"
        onClick={restart}
      >
        RESTART THE GAME
      </button>
    </div>
  );
};

export default FinishedGameScreen;

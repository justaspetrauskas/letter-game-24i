import React from "react";
interface PauseGameScreenProps {
  resume: () => void;
}
const PauseGameScreen: React.FC<PauseGameScreenProps> = ({ resume }) => {
  return (
    <div className="absolute backdrop-blur-md bg-white/30 w-[calc(100vw*0.8)] top-0 left-0 h-full transition-all flex items-center justify-center">
      <button
        className="px-3 py-2 bg-slate-50 hover:bg-slate-400 transition-colors duration-300 hover:text-white"
        onClick={resume}
      >
        RESTART THE GAME
      </button>
    </div>
  );
};

export default PauseGameScreen;

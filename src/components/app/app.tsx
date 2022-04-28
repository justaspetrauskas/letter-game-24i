import React from "react";
import "../../common/styles";

import GameComponent from "../game/GameComponent";
import GameInfo from "../gameStats/GameStats";

// context
import GameInfoProvider from "../../context/GameInfoContext";

const App: React.FC = () => {
  return (
    <GameInfoProvider>
      <div className="relative flex flex-row h-screen w-full overflow-hidden">
        <GameComponent />
        <GameInfo />
      </div>
    </GameInfoProvider>
  );
};

export default App;

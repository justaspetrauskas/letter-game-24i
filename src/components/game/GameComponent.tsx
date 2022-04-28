import React, { useState, useEffect, useContext } from "react";
import { Stage, Layer } from "react-konva";
import { useInterval } from "usehooks-ts";
import LetterComponent from "./LetterComponent";
import FinishedGameScreen from "./FinishedGameScreen";
import PauseGameScreen from "./PauseGameScreen";
// game Logic
import Letter from "./LetterClass";
import { getRandomInt } from "./logic";

// context
import { GameInfoContext } from "../../context/GameInfoContext";
import { GameContextType } from "../../@types/gameStats";

const GameComponent = () => {
  // context
  const {
    increaseScore,
    reset,
    increaseDeadPiecs,
    gameStats,
    increaseTotalPieces,
    pauseTheGame,
  } = useContext(GameInfoContext) as GameContextType;

  const [letterObj, setLetterObj] = useState<Letter[]>([]);

  const createEl = () => {
    // build object
    if (gameStats.gameStatus === "playing") {
      setLetterObj([
        ...letterObj,
        new Letter(window.innerHeight, window.innerWidth * 0.8),
      ]);
      increaseTotalPieces();
    }
  };

  const setSpawnDelay = (level: number = 1) => {
    let min = 0;
    let max = 0;
    switch (level) {
      case 1:
        min = 2000;
        max = 2500;
        break;
      case 2:
        min = 1500;
        max = 2200;
        break;
      case 3:
        min = 1500;
        max = 2200;
        break;
      case 4:
        min = 800;
        max = 1500;
        break;
      case 5:
        min = 400;
        max = 900;
        break;
      default:
        min = 2000;
        max = 2500;
    }
    let spawnDelay = getRandomInt(min, max);

    return spawnDelay;
  };

  useInterval(createEl, setSpawnDelay(gameStats.currentLevel));

  useEffect(() => {
    function downHandler({ key }: KeyboardEvent) {
      // at least two same characters on the screen
      if (gameStats.gameStatus === "playing") {
        // on screen letters that are "alive"
        let onScreenObjects = letterObj.filter(
          (letter) =>
            letter.letter === key.toLocaleLowerCase() &&
            letter.status === "alive"
        );

        if (onScreenObjects.length > 1) {
          increaseScore();
          // remove objects from array with the same letter and that are alive
          let filteredObjects = letterObj.filter((object1) => {
            return !onScreenObjects.some((object2) => {
              return object1.id === object2.id;
            });
          });

          setLetterObj(filteredObjects);
          // setLetterObj(
          //   letterObj.filter(
          //     (letter) =>
          //       (letter.letter !== key.toLocaleLowerCase() &&
          //         letter.status === "alive") ||
          //       letter.status === "dead"
          //   )
          // );
        }
      }
    }
    window.addEventListener("keydown", downHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, [gameStats.gameStatus, letterObj, increaseScore]);

  const touchDown = (id: string) => {
    if (gameStats.gameStatus === "playing") {
      let letter = letterObj.find((obj) => obj.id === id);
      letter!.status = "dead";

      // updateContext
      increaseDeadPiecs();
    }
  };

  const sendTheLocation = (yPos: number) => {
    console.log("Yposition", yPos);
  };

  const handleRestart = () => {
    setLetterObj([]);
    // updateContext
    reset();
  };

  const handleResume = () => {
    pauseTheGame();
  };

  return (
    <div className="">
      <Stage
        width={window.innerWidth * 0.8}
        height={window.innerHeight}
        className=""
      >
        <Layer>
          {gameStats.gameStatus !== "finished" &&
            letterObj?.map((letter: Letter, index: number) => (
              <LetterComponent
                stageHeight={window.innerHeight}
                letterObj={letter}
                touchDown={touchDown}
                level={gameStats.currentLevel}
                gameStatus={gameStats.gameStatus}
                sendTheLocation={sendTheLocation}
                key={index}
              />
            ))}
        </Layer>
      </Stage>
      {gameStats.gameStatus === "finished" && (
        <FinishedGameScreen restart={handleRestart} />
      )}
      {gameStats.gameStatus === "paused" && (
        <PauseGameScreen resume={handleResume} />
      )}
    </div>
  );
};

export default GameComponent;

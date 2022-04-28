import React, { useRef, useEffect, useState } from "react";
import { Group, Rect, Text } from "react-konva";
import Konva from "konva";
import { useInterval } from "usehooks-ts";
import Letter from "./LetterClass";

interface LetterComponentProps {
  letterObj: Letter;
  stageHeight: number;
  level: number;
  gameStatus: string;
  touchDown: (id: string) => void;
}

const LetterComponent = ({
  letterObj,
  stageHeight,
  touchDown,
  level,
  gameStatus,
}: LetterComponentProps) => {
  const boxRef = useRef<Konva.Rect>(null);
  const textRef = useRef<Konva.Text>(null);
  const groupRef = useRef<Konva.Group>(null);

  // if game was paused yPosition must be last recorded position
  const [yPosition, setYPosition] = useState(letterObj.yPos);

  const [isPlaying, setPlaying] = useState<boolean>(true);
  const [delay, setDelay] = useState<number>(10);

  const moveY = (level: number) => {
    let weight = letterObj.weight;
    let gravity = 10;
    if (gameStatus === "playing") {
      setYPosition(yPosition + (1 / weight) * gravity * level);
    }
  };

  useInterval(() => moveY(level), isPlaying ? delay : null);

  useEffect(() => {
    if (isPlaying && groupRef) {
      let letterBox = groupRef.current;
      if (
        yPosition >= stageHeight - letterObj.size - 15 &&
        letterObj.status === "alive"
      ) {
        touchDown(letterObj.id);
        setPlaying(false);
        letterBox?.to({
          y: stageHeight - letterObj.size,
          duration: 0.4,
          easing: Konva.Easings.EaseInOut,
          onFinish: () => setYPosition(stageHeight - letterObj.size),
        });
      }
    }
  }, [stageHeight, yPosition, letterObj, isPlaying, touchDown]);

  useEffect(() => {
    if (groupRef.current) {
      let letterBox = groupRef.current;

      letterBox.to({
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 0.4,
        opacity: 0.5,
        easing: Konva.Easings.EaseInOut,
        onFinish: () =>
          letterBox.to({
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            duration: 0.3,
            easing: Konva.Easings.EaseInOut,
          }),
      });
    }
  }, []);

  useEffect(() => {
    if (gameStatus === "paused") {
      setYPosition(yPosition);
    }
  }, [gameStatus]);

  const {
    xPos,
    letter,
    backgroundColor,
    cornerRadius,
    size,
    fontSize,
    fontColor,
  } = letterObj;

  return (
    <Group x={xPos} y={yPosition} ref={groupRef} opacity={0}>
      <Rect
        ref={boxRef}
        fill={backgroundColor}
        cornerRadius={cornerRadius}
        width={size}
        height={size}
      />
      <Text
        ref={textRef}
        width={size}
        height={size}
        fontSize={fontSize}
        fill={fontColor}
        text={letter.toUpperCase()}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};

export default LetterComponent;

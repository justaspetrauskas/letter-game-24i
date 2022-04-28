import React from "react";
import { useRef, useEffect, useState } from "react";
import { LetterBox } from "./letterBox";

interface CanvasSize {
  width: number;
  height: number;
}

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d")!;
    context.fillStyle = "rgba(255, 255, 255, 0.9)";
    let w = context.canvas.width;
    let h = context.canvas.height;

    const letterBox = new LetterBox(context);
    letterBox.draw();

    const handleResize = () => {
      h = window.innerHeight;
      w = window.innerWidth;
      setCanvasSize({ width: w, height: h });
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [canvasSize]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
    />
  );
};

export default Canvas;

import {
  getRandomBoxSize,
  getRandomColor,
  getRandomLetter,
  getRandomPosition,
  getRandomInt,
} from "./logic";

import uniqid from "uniqid";

class LetterObject {
  id: string;
  letter: string;
  status: "alive" | "dead";
  weight: number;
  size: number;
  cornerRadius: number;
  backgroundColor: string;
  xPos: number;
  yPos: number;
  fontSize: number;
  fontColor: string;
  constructor(stageHeight: number, stageWidth: number) {
    this.id = uniqid();
    this.letter = getRandomLetter();
    this.status = "alive";
    this.weight = getRandomInt(20, 100);
    this.backgroundColor = getRandomColor();
    this.size = getRandomBoxSize(stageHeight);
    this.xPos = getRandomPosition(stageWidth, this.size);
    this.yPos = 0;
    this.cornerRadius = Math.ceil(this.size / 6);
    this.fontColor = "white";
    this.fontSize = this.size / 2;
  }

  pause() {}
}
export default LetterObject;

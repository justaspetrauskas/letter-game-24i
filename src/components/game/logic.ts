export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomBoxSize(stageHeight: number) {
  let max = stageHeight / 5;
  let min = stageHeight / 10;
  let size = getRandomInt(min, max);

  return size;
}

export function getRandomColor() {
  let r = getRandomInt(100, 255);
  let g = getRandomInt(100, 255);
  let b = getRandomInt(100, 255);

  let color = `rgba(${r},${g},${b},1)`;

  return color;
}

export function getRandomLetter() {
  let possibleLetters = "abcde";
  let index = getRandomInt(0, possibleLetters.length - 1);
  let letter = possibleLetters.charAt(index);

  return letter;
}

export function getRandomPosition(stageWidth: number, rectSize: number) {
  let max = stageWidth - rectSize;
  let pos = getRandomInt(0, max);

  return pos;
}

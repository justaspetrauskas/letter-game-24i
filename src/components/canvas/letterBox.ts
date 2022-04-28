export interface LetterBox {
  ctx: CanvasRenderingContext2D;
}

export class LetterBox {
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.rect(300, 20, 80, 80);
    this.ctx.fillStyle = "orange";
    this.ctx.fill();
  }
}

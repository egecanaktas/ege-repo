let cols = 8;
let rows = 8;
let squareSize = 80;

let pieces = [];
let draggingPiece = null;
let offsetX, offsetY;

function setup() {
  createCanvas(cols * squareSize, rows * squareSize);
  textAlign(CENTER, CENTER);
  textSize(squareSize * 0.7);
  noLoop();

  setupBoard();
}

function draw() {
  drawBoard();
  for (let p of pieces) {
    p.show();
  }
}

function drawBoard() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if ((x + y) % 2 === 0) {
        fill(255);
      } else {
        fill(100, 150, 100);
      }
      rect(x * squareSize, y * squareSize, squareSize, squareSize);
    }
  }
}

function setupBoard() {
  // Unicode symbols for black and white pieces
  const whiteBack = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'];
  const blackBack = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];

  // Black pieces
  for (let i = 0; i < 8; i++) {
    pieces.push(new ChessPiece(i, 0, blackBack[i]));
    pieces.push(new ChessPiece(i, 1, '♟'));
  }

  // White pieces
  for (let i = 0; i < 8; i++) {
    pieces.push(new ChessPiece(i, 6, '♙'));
    pieces.push(new ChessPiece(i, 7, whiteBack[i]));
  }
}

function mousePressed() {
  for (let i = pieces.length - 1; i >= 0; i--) {
    let p = pieces[i];
    if (p.isMouseOver()) {
      draggingPiece = p;
      offsetX = mouseX - p.x;
      offsetY = mouseY - p.y;
      pieces.splice(i, 1);
      pieces.push(draggingPiece);
      break;
    }
  }
}

function mouseDragged() {
  if (draggingPiece) {
    draggingPiece.x = mouseX - offsetX;
    draggingPiece.y = mouseY - offsetY;
    redraw();
  }
}

function mouseReleased() {
  if (draggingPiece) {
    draggingPiece.col = constrain(floor(draggingPiece.x / squareSize), 0, 7);
    draggingPiece.row = constrain(floor(draggingPiece.y / squareSize), 0, 7);
    draggingPiece.snapToGrid();
    draggingPiece = null;
    redraw();
  }
}

class ChessPiece {
  constructor(col, row, symbol) {
    this.col = col;
    this.row = row;
    this.symbol = symbol;
    this.snapToGrid();
  }

  snapToGrid() {
    this.x = this.col * squareSize + squareSize / 2;
    this.y = this.row * squareSize + squareSize / 2;
  }

  show() {
    fill(0); // Always black pieces
    text(this.symbol, this.x, this.y);
  }

  isMouseOver() {
    return (
      mouseX > this.x - squareSize / 2 &&
      mouseX < this.x + squareSize / 2 &&
      mouseY > this.y - squareSize / 2 &&
      mouseY < this.y + squareSize / 2
    );
  }
}

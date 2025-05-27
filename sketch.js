let cols = 8;
let rows = 8;
let squareSize = 80;

let pieces = [];
let draggingPiece = null;
let animatingPiece = null;
let animStartX, animStartY, animEndX, animEndY, animProgress;
let animTargetCol, animTargetRow;

let offsetX, offsetY;

let currentTurn = 'white';
let gameOver = false;

function setup() {
  createCanvas(cols * squareSize, rows * squareSize + 40);
  textAlign(CENTER, CENTER);
  frameRate(60);
  noStroke();

  setupBoard();
}

function draw() {
  background(220);
  drawBoard();

  // Draw all pieces, except animating one (draw animating one on top later)
  for (let p of pieces) {
    if (p !== animatingPiece) p.show();
  }

  // Animate moving piece if any
  if (animatingPiece) {
    animProgress += 0.15; // speed of animation, adjust if needed
    if (animProgress >= 1) {
      animatingPiece.col = animTargetCol;
      animatingPiece.row = animTargetRow;
      animatingPiece.snapToGrid();
      animatingPiece = null;

      currentTurn = currentTurn === 'white' ? 'black' : 'white';

      // Check for checkmate or stalemate
      if (isInCheck(currentTurn) && noLegalMoves(currentTurn)) {
        gameOver = true;
        console.log("Checkmate!");
      } else if (!isInCheck(currentTurn) && noLegalMoves(currentTurn)) {
        gameOver = true;
        console.log("Stalemate!");
      }
    } else {
      // Interpolate position
      animatingPiece.x = lerp(animStartX, animEndX, animProgress);
      animatingPiece.y = lerp(animStartY, animEndY, animProgress);
      animatingPiece.show();
    }
    redraw();
    return;
  }

  // Draw dragging piece on top
  if (draggingPiece) draggingPiece.show();

  fill(0);
  textSize(20);
  if (gameOver) {
    text(`Checkmate! ${currentTurn === 'white' ? 'Black' : 'White'} wins!`, width / 2, height - 10);
  } else {
    text(`Turn: ${currentTurn}`, width / 2, height - 10);
    if (isInCheck(currentTurn)) {
      fill(255, 0, 0);
      text('Check!', width / 2, height - 40);
    }
  }
}

function drawBoard() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if ((x + y) % 2 === 0) fill(255);
      else fill(100, 150, 100);
      rect(x * squareSize, y * squareSize, squareSize, squareSize);
    }
  }
}

function setupBoard() {
  pieces = [];
  const whiteBack = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'];
  const blackBack = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];

  for (let i = 0; i < 8; i++) {
    pieces.push(new ChessPiece(i, 0, blackBack[i], 'black'));
    pieces.push(new ChessPiece(i, 1, '♟', 'black'));
  }
  for (let i = 0; i < 8; i++) {
    pieces.push(new ChessPiece(i, 6, '♙', 'white'));
    pieces.push(new ChessPiece(i, 7, whiteBack[i], 'white'));
  }
}

function mousePressed() {
  if (gameOver || animatingPiece) return;

  for (let i = pieces.length - 1; i >= 0; i--) {
    let p = pieces[i];
    if (p.isMouseOver() && p.color === currentTurn) {
      draggingPiece = p;
      offsetX = mouseX - p.x;
      offsetY = mouseY - p.y;
      pieces.splice(i, 1);
      pieces.push(draggingPiece); // bring to top
      redraw();
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
  if (!draggingPiece || animatingPiece) return;

  let targetCol = constrain(floor(mouseX / squareSize), 0, 7);
  let targetRow = constrain(floor(mouseY / squareSize), 0, 7);

  if (
    draggingPiece.isValidMove(targetCol, targetRow) &&
    !wouldBeInCheck(draggingPiece, targetCol, targetRow, currentTurn)
  ) {
    let captured = pieces.find(p => p.col === targetCol && p.row === targetRow);

    if (captured) {
      // Remove captured piece from board
      pieces = pieces.filter(p => p !== captured);

      // Only transform if the capturing piece is NOT a king
      if (draggingPiece.symbol !== '♔' && draggingPiece.symbol !== '♚') {
        // Transform dragging piece's symbol to captured piece type, keep color
        const whitePieces = ['♙', '♖', '♘', '♗', '♕', '♔'];
        const blackPieces = ['♟', '♜', '♞', '♝', '♛', '♚'];

        let baseSymbol = captured.symbol;

        // Map black symbols to white for standardization
        const blackToWhiteMap = {
          '♟': '♙', '♜': '♖', '♞': '♘', '♝': '♗', '♛': '♕', '♚': '♔'
        };

        if (blackToWhiteMap[baseSymbol]) {
          baseSymbol = blackToWhiteMap[baseSymbol];
        }

        if (currentTurn === 'white') {
          draggingPiece.symbol = baseSymbol;
        } else {
          // Map white symbols to black equivalents
          const whiteToBlackMap = {
            '♙': '♟', '♖': '♜', '♘': '♞', '♗': '♝', '♕': '♛', '♔': '♚'
          };
          draggingPiece.symbol = whiteToBlackMap[baseSymbol] || baseSymbol;
        }
      }
    }

    // Start animation of move
    animatingPiece = draggingPiece;
    animStartX = draggingPiece.x;
    animStartY = draggingPiece.y;
    animEndX = targetCol * squareSize + squareSize / 2;
    animEndY = targetRow * squareSize + squareSize / 2;
    animProgress = 0;

    animTargetCol = targetCol;
    animTargetRow = targetRow;

  } else {
    // Invalid move, snap back
    draggingPiece.snapToGrid();
  }

  draggingPiece = null;
  redraw();
}

function isInCheck(color) {
  let kingSymbol = color === 'white' ? '♔' : '♚';
  let king = pieces.find(p => p.symbol === kingSymbol && p.color === color);
  if (!king) return false;

  for (let p of pieces) {
    if (p.color !== color && p.isValidMove(king.col, king.row)) {
      return true;
    }
  }
  return false;
}

function noLegalMoves(color) {
  let playerPieces = pieces.filter(p => p.color === color);

  for (let piece of playerPieces) {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (
          piece.isValidMove(c, r) &&
          !wouldBeInCheck(piece, c, r, color)
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

function wouldBeInCheck(piece, targetCol, targetRow, color) {
  let origCol = piece.col;
  let origRow = piece.row;
  let captured = pieces.find(p => p.col === targetCol && p.row === targetRow);

  piece.col = targetCol;
  piece.row = targetRow;

  if (captured) {
    pieces = pieces.filter(p => p !== captured);
  }

  let inCheck = isInCheck(color);

  piece.col = origCol;
  piece.row = origRow;
  if (captured) {
    pieces.push(captured);
  }

  return inCheck;
}

class ChessPiece {
  constructor(col, row, symbol, color) {
    this.col = col;
    this.row = row;
    this.symbol = symbol;
    this.color = color;
    this.snapToGrid();
  }

  snapToGrid() {
    this.x = this.col * squareSize + squareSize / 2;
    this.y = this.row * squareSize + squareSize / 2;
  }

  show() {
    fill(this.color === 'white' ? 0 : 0);
    textSize(squareSize * 0.7);
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

  isValidMove(targetCol, targetRow) {
    if (targetCol === this.col && targetRow === this.row) return false;
    if (targetCol < 0 || targetCol >= cols || targetRow < 0 || targetRow >= rows) return false;

    let targetPiece = pieces.find(p => p.col === targetCol && p.row === targetRow);
    if (targetPiece && targetPiece.color === this.color) return false;

    // Pawn moves
    if (this.symbol === '♙' || this.symbol === '♟') {
      const direction = this.color === 'white' ? -1 : 1;
      const startRow = this.color === 'white' ? 6 : 1;

      if (targetCol === this.col && targetRow === this.row + direction && !targetPiece) {
        return true;
      }
      if (
        targetCol === this.col &&
        this.row === startRow &&
        targetRow === this.row + 2 * direction
      ) {
        let frontPiece = pieces.find(p => p.col === this.col && p.row === this.row + direction);
        if (!frontPiece && !targetPiece) return true;
      }
      if (
        Math.abs(targetCol - this.col) === 1 &&
        targetRow === this.row + direction &&
        targetPiece &&
        targetPiece.color !== this.color
      ) {
        return true;
      }
      return false;
    }

    // Bishop moves - diagonal any distance
    if (this.symbol === '♗' || this.symbol === '♝') {
      let colDiff = targetCol - this.col;
      let rowDiff = targetRow - this.row;
      if (Math.abs(colDiff) !== Math.abs(rowDiff)) return false;

      let stepCol = colDiff > 0 ? 1 : -1;
      let stepRow = rowDiff > 0 ? 1 : -1;

      let c = this.col + stepCol;
      let r = this.row + stepRow;
      while (c !== targetCol && r !== targetRow) {
        if (pieces.find(p => p.col === c && p.row === r)) return false;
        c += stepCol;
        r += stepRow;
      }
      return true;
    }

    // Rook moves - horizontal or vertical any distance
    if (this.symbol === '♖' || this.symbol === '♜') {
      if (targetCol !== this.col && targetRow !== this.row) return false;

      if (targetCol === this.col) {
        let step = targetRow > this.row ? 1 : -1;
        for (let r = this.row + step; r !== targetRow; r += step) {
          if (pieces.find(p => p.col === this.col && p.row === r)) return false;
        }
      } else {
        let step = targetCol > this.col ? 1 : -1;
        for (let c = this.col + step; c !== targetCol; c += step) {
          if (pieces.find(p => p.col === c && p.row === this.row)) return false;
        }
      }
      return true;
    }

    // Knight moves - L shape
    if (this.symbol === '♘' || this.symbol === '♞') {
      let colDiff = Math.abs(targetCol - this.col);
      let rowDiff = Math.abs(targetRow - this.row);
      return (colDiff === 2 && rowDiff === 1) || (colDiff === 1 && rowDiff === 2);
    }

    // King moves - one square any direction (no knight moves)
    if (this.symbol === '♔' || this.symbol === '♚') {
      let colDiff = Math.abs(targetCol - this.col);
      let rowDiff = Math.abs(targetRow - this.row);

      if (colDiff <= 1 && rowDiff <= 1) {
        return true;
      }

      return false;
    }

    // Queen moves - rook + bishop
    if (this.symbol === '♕' || this.symbol === '♛') {
      let colDiff = targetCol - this.col;
      let rowDiff = targetRow - this.row;

      // Diagonal (bishop)
      if (Math.abs(colDiff) === Math.abs(rowDiff)) {
        let stepCol = colDiff > 0 ? 1 : -1;
        let stepRow = rowDiff > 0 ? 1 : -1;
        let c = this.col + stepCol;
        let r = this.row + stepRow;
        while (c !== targetCol && r !== targetRow) {
          if (pieces.find(p => p.col === c && p.row === r)) return false;
          c += stepCol;
          r += stepRow;
        }
        return true;
      }

      // Horizontal or vertical (rook)
      if (targetCol === this.col || targetRow === this.row) {
        if (targetCol === this.col) {
          let step = targetRow > this.row ? 1 : -1;
          for (let r = this.row + step; r !== targetRow; r += step) {
            if (pieces.find(p => p.col === this.col && p.row === r)) return false;
          }
        } else {
          let step = targetCol > this.col ? 1 : -1;
          for (let c = this.col + step; c !== targetCol; c += step) {
            if (pieces.find(p => p.col === c && p.row === this.row)) return false;
          }
        }
        return true;
      }

      return false;
    }

    return false;
  }
}


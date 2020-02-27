// Set the canvas and context
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);
const canvasWrapper = document.getElementById('score-wrapper');

// The playfield is 12 blocks wide and 20 high
const arena = createMatrix(12, 20);

// Set variables
let animationId;
let cleanGame = false;
let dropCounter = 0;
let lastTime = 0;
let stopGame = false;

const colors = [
  null,
  '#cc2a36',
  '#f2d03a',
  '#632787',
  '#0164a6',
  '#188d88',
  '#87ac3d',
  '#f47320',
];

const gameStats = {
  score: 0,
  createdBlocks: 0,
  dropInterval: 1000,
}

const player = {
  matrix: null,
  pos: { x: 0, y: 0 },
}

// Function which is called in playerDrop when a collision is detected
// Every row in the arena is checked for 0-value
// If there is a 0-value the function will run the next arena-row
// If there is no 0-value, it means that the row is full and it should be removed from the arena
// The row is spliced from the arena and filled again with 0 values
// This one is stored in the row const and than added to the top of the arena
// After this, the y value is added with 1 so it will check the 'new' same row-number again 
function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y; // Offset the y because a new row is put `on top` of the arena
    gameStats.score += rowCount * 10;
    rowCount *= 2;
  }
}

// The collide function checks if a block-piece collides with another block or the border of the arena
function collide(arena, player) {
  // PlayerBlockMatrix is the tetrisBlock of the player
  // PlayerBlockPosition is the position of the playerBlockMatrix based on the offset of the 0,0 point in the top-left of the arena.
  const [playerBlockMatrix, playerBlockPosition] = [player.matrix, player.pos];
  for (let y = 0; y < playerBlockMatrix.length; ++y) {
    for (let x = 0; x < playerBlockMatrix[y].length; ++x) {
      if (playerBlockMatrix[y][x] !== 0 && (arena[y + playerBlockPosition.y] && arena[y + playerBlockPosition.y][x + playerBlockPosition.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

// This is the playfield parted in arrays
function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0))
  }
  return matrix;
}

// Function which create the separate pieces
function createPiece(type) {
  gameStats.dropInterval = (gameStats.dropInterval >= 200) ? (gameStats.dropInterval -= 2) : 50;
  if (type === 'T') {
    return [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ];
  } else if (type === 'O') {
    return [
      [2, 2],
      [2, 2],
    ];
  } else if (type === 'L') {
    return [
      [0, 3, 0],
      [0, 3, 0],
      [0, 3, 3],
    ];
  } else if (type === 'J') {
    return [
      [0, 4, 0],
      [0, 4, 0],
      [4, 4, 0],
    ];
  } else if (type === 'I') {
    return [
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
    ];
  } else if (type === 'S') {
    return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0],
    ];
  } else if (type === 'Z') {
    return [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ];
  }
}

// Creates a black canvas and draws the arena with the colors-values and player block
function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  if (!cleanGame) {
    drawMatrix(player.matrix, player.pos);
  }
}

// Draws matrix
function drawMatrix(matrix, offset) {
  matrix.forEach((row, yIndex) => {
    row.forEach((value, xIndex) => {
      if (value !== 0) {
        // Draw rect for each block and fill it with the color from the array
        context.fillStyle = colors[value];
        context.fillRect(xIndex + offset.x, yIndex + offset.y, 1, 1);

        // LineWidth of the 'shadow' and 'highlight' borderstrokes
        context.lineWidth = .15;

        // Draw a line on the left and bottom border to create a 'shadow'
        context.beginPath();
        context.moveTo(xIndex + offset.x, yIndex + offset.y);
        context.lineTo(xIndex + offset.x, yIndex + offset.y + 1);
        context.lineTo(xIndex + offset.x + 1, yIndex + offset.y + 1);
        context.strokeStyle = `rgba(0,0,0,0.4)`;
        context.stroke();

        // Draw a line on the top and right border to create a 'highlight'
        context.beginPath();
        context.moveTo(xIndex + offset.x, yIndex + offset.y);
        context.lineTo(xIndex + offset.x + 1, yIndex + offset.y);
        context.lineTo(xIndex + offset.x + 1, yIndex + offset.y + 1);
        context.strokeStyle = `rgba(255,255,255,0.35)`;
        context.stroke();
      }
    })
  })
}

// Called when the reset button is clicked
function handleResetClick() {
  stopGame = false;
  cleanGame = false;
  gameStats.score = 0;
  gameStats.dropInterval = 1000;
  canvasWrapper.style.display = 'none';
  arena.forEach(row => row.fill(0));
  playerResetPiece();
  updateScore();
  update();
}

// Merges the block to the arena array
function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    })
  })
}

// Gets called every update or on every down-arrow-key press
// Moves the player-block down and checks for collision
function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    if (stopGame) {
      return;
    }
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
}

// Moving the player in a direction and checks for collision with the borders
function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

// Handles the reset of the pieces
function playerResetPiece() {
  const pieces = 'ILJOTSZ'
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
  dropCounter = 0;
  lastTime = 0;
}

// Handles the reset of the player pieces and checks if there is a collision between
// the arena and the player
function playerReset() {
  playerResetPiece();
  if (collide(arena, player)) {
    if (arena[0].some((value) => value !== 0)) {
      cleanGame = true;
    } else {
      loopThis:
      for (let y = player.matrix.length - 1; y >= 0; y--) {
        for (let x = player.matrix[y].length - 1; x >= 0; x--) {
          if (player.matrix[y][x] !== 0 && arena[y + player.pos.y] && arena[y + player.pos.y][x + player.pos.x] !== 0) {
            player.pos.y--;
            y = player.matrix.length;
            continue loopThis;
          }
        }
      }
      draw();
    }
    stopGame = true;
  }
}

// Handles the player rotation
// If there is a collision with the arena, 
// the block moves back 
function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1))
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

// Rotation of the piece
function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]]
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

// The update is called about ever 16ms and this is calculate by .
// Add every of the deltatimes together until the gameStats.dropInterval is reached.
// Then update the y pos of the player and reset the counter so a new interval can be calculated
function update(time = 0) {
  if (stopGame) {
    canvasWrapper.style.display = 'block';
    document.getElementById('score').innerText = "Game Over";
    cancelAnimationFrame(animationId);
    return;
  }
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > gameStats.dropInterval) {
    playerDrop();
  }
  draw();
  animationId = requestAnimationFrame(update);
}

// Updates the score
function updateScore() {
  document.getElementById('score').innerText = gameStats.score;
  document.getElementById('final-score').innerText = gameStats.score;
}

// Handles the key-events
document.addEventListener('keydown', event => {
  if (event.keyCode === 37) {
    playerMove(-1);
  } else if (event.keyCode === 39) {
    playerMove(1);
  } else if (event.keyCode === 40) {
    if (!stopGame) {
      playerDrop();
    }
  } else if (event.keyCode === 81) {
    playerRotate(-1);
  } else if (event.keyCode === 87) {
    playerRotate(1);
  }
})

// Bootstrap the game
playerReset();
updateScore();
update();

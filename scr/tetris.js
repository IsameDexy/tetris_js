// Set the canvas and context
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

// Function which is called in playerDrop when a collision is detected
// Every row in the arena is checked for 0-value
// If there is a 0-value the function will run the next arena-row
// If there is no 0-value, it means that the row full and it should be removes from the arena
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
    ++y; // offset the y because a new row is put `on top` of the arena
    player.score += rowCount * 10;
    rowCount *= 2;
  }
}

// The collide function checks if a block-piece collides with another block or the border of the arena

// DEZE NOG VERDER UITZOEKEN:
function collide(arena, player) {
  // PlayerBlockMatrix is the tetrisBlock of the player
  // PlayerBlockPosition is the position of the playerBlockMatrix based on the offset of the 0,0 point in the top-left of the arena.

  const [playerBlockMatrix, playerBlockPosition] = [player.matrix, player.pos];
  for (let y = 0; y < playerBlockMatrix.length; ++y) {
    for (let x = 0; x < playerBlockMatrix[y].length; ++x) {
      // First we check the player matrix on index y & x
      // we check if the arena has a row and a column and if it has both of them and are not 0 then we return true
      // In case the row doesn't exisst it means that we also collide.
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

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, yIndex) => {
    row.forEach((value, xIndex) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(xIndex + offset.x, yIndex + offset.y, 1, 1)
      }
    })
  })
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    })
  })
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerReset() {
  const pieces = 'ILJOTSZ'
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
  }
}

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

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;

// The update is called about ever 16ms and this is calculate by .
// Add every of the deltatimes together until the dropInterval is reached.
// Then update the y pos of the player and reset the counter so a new interval can be calculated
function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

function updateScore() {
  document.getElementById('score').innerText = player.score;
}

document.addEventListener('keydown', event => {
  if (event.keyCode === 37) {
    playerMove(-1);
  } else if (event.keyCode === 39) {
    playerMove(1);
  } else if (event.keyCode === 40) {
    playerDrop();
  } else if (event.keyCode === 81) {
    playerRotate(-1);
  } else if (event.keyCode === 87) {
    playerRotate(1);
  }
})

const colors = [
  null,
  'purple',
  'yellow',
  'orange',
  'blue',
  'aqua',
  'green',
  'red',
];

// the playfield is 12 blocks wide and 20 high
const arena = createMatrix(12, 20);

// player stats
const player = {
  matrix: null,
  pos: { x: 0, y: 0 },
  score: 0,
}

// Bootstrap the game
playerReset();
updateScore();
update();


// If game is ended, give message with restart button
// Moeilijkheid erin bouwen => steeds sneller
// Kleuren aanpassen
// Borders om blokjes??
// Next blokje?
// Highscore naar database?

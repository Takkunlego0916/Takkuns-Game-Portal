const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const speedLevelEl = document.getElementById('speedLevel');
const newBtn = document.getElementById('newBtn');
const pauseBtn = document.getElementById('pauseBtn');
const wrapToggle = document.getElementById('wrapToggle');

const overlay = document.getElementById('overlay');
const ovTitle = document.getElementById('ov-title');
const ovMsg = document.getElementById('ov-msg');
const retryBtn = document.getElementById('retry');

const dpadUp = document.getElementById('dpadUp');
const dpadDown = document.getElementById('dpadDown');
const dpadLeft = document.getElementById('dpadLeft');
const dpadRight = document.getElementById('dpadRight');

const BEST_KEY = 'snake_best_score';
const GRID_SIZE = 20;
const CELL = canvas.width / GRID_SIZE;
const BASE_INTERVAL = 160;
const MIN_INTERVAL = 70;

let snake = [];
let direction = { x: 1, y: 0 };
let queuedDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let best = Number(localStorage.getItem(BEST_KEY) || 0);
let running = false;
let paused = false;
let loopId = null;
let speedLevel = 1;

function randomEmptyCell() {
  const occupied = new Set(snake.map(s => s.x + ',' + s.y));
  let cell;
  do {
    cell = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  } while (occupied.has(cell.x + ',' + cell.y));
  return cell;
}

function computeInterval() {
  const level = 1 + Math.floor(score / 5);
  const interval = Math.max(MIN_INTERVAL, BASE_INTERVAL - (level - 1) * 8);
  return { interval, level };
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
}

function render() {
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--board-bg').trim() || '#0b1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCell(food.x, food.y, getComputedStyle(document.documentElement).getPropertyValue('--food').trim() || '#f87171');

  snake.forEach((seg, i) => {
    const color = i === 0
      ? getComputedStyle(document.documentElement).getPropertyValue('--snake-head').trim()
      : getComputedStyle(document.documentElement).getPropertyValue('--snake-body').trim();
    drawCell(seg.x, seg.y, color || '#22c55e');
  });

  scoreEl.textContent = score;
  bestEl.textContent = best;
  speedLevelEl.textContent = speedLevel;
}

function setDirection(dx, dy) {
  if (!running || paused) return;
  if (dx === -direction.x && dy === -direction.y) return;
  queuedDirection = { x: dx, y: dy };
}

function tick() {
  direction = queuedDirection;

  const head = snake[0];
  let nx = head.x + direction.x;
  let ny = head.y + direction.y;

  if (wrapToggle.checked) {
    nx = (nx + GRID_SIZE) % GRID_SIZE;
    ny = (ny + GRID_SIZE) % GRID_SIZE;
  } else if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) {
    endGame();
    return;
  }

  if (snake.some((seg, i) => i !== snake.length - 1 && seg.x === nx && seg.y === ny)) {
    endGame();
    return;
  }

  const newHead = { x: nx, y: ny };
  snake.unshift(newHead);

  if (nx === food.x && ny === food.y) {
    score += 1;
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
    }
    food = randomEmptyCell();
    rescheduleLoop();
  } else {
    snake.pop();
  }

  render();
}

function rescheduleLoop() {
  if (loopId !== null) {
    clearInterval(loopId);
    loopId = null;
  }
  const { interval, level } = computeInterval();
  speedLevel = level;
  if (running && !paused) {
    loopId = setInterval(tick, interval);
  }
}

function endGame() {
  running = false;
  if (loopId !== null) {
    clearInterval(loopId);
    loopId = null;
  }
  ovTitle.textContent = 'ゲームオーバー';
  ovMsg.textContent = `スコア: ${score}`;
  overlay.classList.add('show');
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? '再開' : '一時停止';
  if (paused) {
    if (loopId !== null) {
      clearInterval(loopId);
      loopId = null;
    }
  } else {
    rescheduleLoop();
  }
}

function startGame() {
  if (loopId !== null) {
    clearInterval(loopId);
    loopId = null;
  }

  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  queuedDirection = { x: 1, y: 0 };
  score = 0;
  speedLevel = 1;
  running = true;
  paused = false;
  pauseBtn.textContent = '一時停止';

  food = randomEmptyCell();
  overlay.classList.remove('show');

  render();
  rescheduleLoop();
}

document.addEventListener('keydown', e => {
  if (e.key === ' ') {
    e.preventDefault();
    togglePause();
    return;
  }
  if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') setDirection(0, -1);
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') setDirection(0, 1);
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') setDirection(-1, 0);
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') setDirection(1, 0);
});

let touchStartX = 0, touchStartY = 0;

canvas.addEventListener('touchstart', e => {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, { passive: true });

canvas.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection(dx > 0 ? 1 : -1, 0);
  } else {
    setDirection(0, dy > 0 ? 1 : -1);
  }
}, { passive: true });

dpadUp.addEventListener('click', () => setDirection(0, -1));
dpadDown.addEventListener('click', () => setDirection(0, 1));
dpadLeft.addEventListener('click', () => setDirection(-1, 0));
dpadRight.addEventListener('click', () => setDirection(1, 0));

newBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

startGame();

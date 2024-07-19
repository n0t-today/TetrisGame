// tetris.js

// базовые настройки игры
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const ROW = 20;
const COL = COLUMN = 10;
const SQ = squareSize = 30;
const VACANT = 'black'; // цвет пустой клетки

let score = 0;
let paused = false;
let dropStart;
let gameOver = false;
let interval = 1000; // default drop interval for easy level

// Переменные для анимации значка паузы
let pauseX = Math.random() * (canvas.width - 100);
let pauseY = Math.random() * (canvas.height - 50);
let pauseSpeedX = 2;
let pauseSpeedY = 2;

// рисуем квадрат
function drawSquare(x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * SQ, y * SQ, SQ, SQ);

    context.strokeStyle = 'white';
    context.strokeRect(x * SQ, y * SQ, SQ, SQ);
}

// создаем игровое поле
let board = [];
for (let r = 0; r < ROW; r++) {
    board[r] = [];
    for (let c = 0; c < COL; c++) {
        board[r][c] = VACANT;
    }
}

// рисуем игровое поле
function drawBoard() {
    for (let r = 0; r < ROW; r++) {
        for (let c = 0; c < COL; c++) {
            drawSquare(c, r, board[r][c]);
        }
    }
}

drawBoard();

// создаем фигуры
function randomPiece() {
    let r = Math.floor(Math.random() * PIECES.length); // 0 -> 6
    return new Piece(PIECES[r][0], PIECES[r][1]);
}

let p;

// объект фигуры
function Piece(tetromino, color) {
    this.tetromino = tetromino;
    this.color = color;

    this.tetrominoN = 0; // начальная ротация
    this.activeTetromino = this.tetromino[this.tetrominoN];

    // контроль фигуры
    this.x = 3;
    this.y = -2;
}

// заполняем квадрат цветом
Piece.prototype.fill = function(color) {
    for (let r = 0; r < this.activeTetromino.length; r++) {
        for (let c = 0; c < this.activeTetromino.length; c++) {
            if (this.activeTetromino[r][c]) {
                drawSquare(this.x + c, this.y + r, color);
            }
        }
    }
}

// рисуем фигуру на доске
Piece.prototype.draw = function() {
    this.fill(this.color);
    drawProjection(this);
}

// удаляем фигуру с доски
Piece.prototype.unDraw = function() {
    this.fill(VACANT);
    unDrawProjection(this);
}

// перемещаем фигуру вниз
Piece.prototype.moveDown = function() {
    if (!this.collision(0, 1, this.activeTetromino)) {
        this.unDraw();
        this.y++;
        this.draw();
    } else {
        this.lock();
        if (!gameOver) {
            p = randomPiece();
        }
    }
}

// перемещаем фигуру вправо
Piece.prototype.moveRight = function() {
    if (!this.collision(1, 0, this.activeTetromino)) {
        this.unDraw();
        this.x++;
        this.draw();
    }
}

// перемещаем фигуру влево
Piece.prototype.moveLeft = function() {
    if (!this.collision(-1, 0, this.activeTetromino)) {
        this.unDraw();
        this.x--;
        this.draw();
    }
}

// вращаем фигуру
Piece.prototype.rotate = function() {
    let nextPattern = this.tetromino[(this.tetrominoN + 1) % this.tetromino.length];
    let kick = 0;

    if (this.collision(0, 0, nextPattern)) {
        if (this.x > COL / 2) {
            kick = -1;
        } else {
            kick = 1;
        }
    }

    if (!this.collision(kick, 0, nextPattern)) {
        this.unDraw();
        this.x += kick;
        this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length;
        this.activeTetromino = nextPattern;
        this.draw();
    }
}

Piece.prototype.collision = function(x, y, piece) {
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece.length; c++) {
            if (!piece[r][c]) {
                continue;
            }

            let newX = this.x + c + x;
            let newY = this.y + r + y;

            if (newX < 0 || newX >= COL || newY >= ROW) {
                return true;
            }

            if (newY < 0) {
                continue;
            }

            if (board[newY][newX] !== VACANT) {
                return true;
            }
        }
    }
    return false;
}

// блокировка фигуры и создание новой фигуры
Piece.prototype.lock = function() {
    for (let r = 0; r < this.activeTetromino.length; r++) {
        for (let c = 0; c < this.activeTetromino.length; c++) {
            if (!this.activeTetromino[r][c]) {
                continue;
            }

            if (this.y + r < 0) {
                showGameOver();
                gameOver = true;
                break;
            }

            board[this.y + r][this.x + c] = this.color;
        }
    }

    for (let r = 0; r < ROW; r++) {
        let isRowFull = true;
        for (let c = 0; c < COL; c++) {
            isRowFull = isRowFull && (board[r][c] !== VACANT);
        }
        if (isRowFull) {
            for (let y = r; y > 1; y--) {
                for (let c = 0; c < COL; c++) {
                    board[y][c] = board[y - 1][c];
                }
            }
            for (let c = 0; c < COL; c++) {
                board[0][c] = VACANT;
            }
            score += 100;
            updateScore();
        }
    }

    drawBoard();
}

// управление с клавиатуры
document.addEventListener('keydown', CONTROL);

function CONTROL(event) {
    if (!paused && !gameOver) {
        if (event.keyCode === 37) {
            p.moveLeft();
            dropStart = Date.now();
        } else if (event.keyCode === 38) {
            p.rotate();
            dropStart = Date.now();
        } else if (event.keyCode === 39) {
            p.moveRight();
            dropStart = Date.now();
        } else if (event.keyCode === 40) {
            p.moveDown();
        }
    }
    if (event.keyCode === 80) { // P key
        if (!gameOver) {
            paused = !paused;
            togglePauseOverlay(paused);
        }
    } else if (event.keyCode === 32) { // Space key
        if (gameOver) {
            resetGame();
        }
    }
}

// сброс фигуры
function drop() {
    let now = Date.now();
    let delta = now - dropStart;
    if (delta > interval && !paused && !gameOver) {
        p.moveDown();
        dropStart = Date.now();
    }
    if (!gameOver) {
        requestAnimationFrame(drop);
    }
}

function updateScore() {
    document.getElementById('score').innerText = `Score: ${score}`;
}

function showMessage(msg) {
    document.getElementById('message').innerText = msg;
}

function resetGame() {
    score = 0;
    updateScore();
    board = [];
    for (let r = 0; r < ROW; r++) {
        board[r] = [];
        for (let c = 0; c < COL; c++) {
            board[r][c] = VACANT;
        }
    }
    drawBoard();
    gameOver = false;
    showMessage('');
    toggleGameOverOverlay(false);
    p = randomPiece();
    dropStart = Date.now();
    drop();
}

function togglePauseOverlay(show) {
    const overlay = document.getElementById('pause-overlay');
    overlay.style.display = show ? 'block' : 'none';
    if (show) {
        movePauseText();
    }
}

function toggleGameOverOverlay(show) {
    const overlay = document.getElementById('gameover-overlay');
    overlay.style.display = show ? 'block' : 'none';
    if (show) {
        document.getElementById('final-score').innerText = `Score: ${score}`;
    } else {
        document.getElementById('final-score').innerText = '';
    }
}

function startGame(difficulty) {
    switch (difficulty) {
        case 'easy':
            interval = 1000;
            break;
        case 'medium':
            interval = 700;
            break;
        case 'hard':
            interval = 400;
            break;
    }
    document.getElementById('difficulty-selection').style.display = 'none';
    p = randomPiece();
    dropStart = Date.now();
    drop();
}

// функция для рисования проекции
function drawProjection(piece) {
    let projectionY = piece.y;
    while (!piece.collision(0, projectionY - piece.y + 1, piece.activeTetromino)) {
        projectionY++;
    }
    for (let r = 0; r < piece.activeTetromino.length; r++) {
        for (let c = 0; c < piece.activeTetromino.length; c++) {
            if (piece.activeTetromino[r][c]) {
                drawSquare(piece.x + c, projectionY + r, 'rgba(211, 211, 211, 0.7)'); // light gray color for projection
            }
        }
    }
}

// функция для удаления старой проекции
function unDrawProjection(piece) {
    let projectionY = piece.y;
    while (!piece.collision(0, projectionY - piece.y + 1, piece.activeTetromino)) {
        projectionY++;
    }
    for (let r = 0; r < piece.activeTetromino.length; r++) {
        for (let c = 0; c < piece.activeTetromino.length; c++) {
            if (piece.activeTetromino[r][c]) {
                drawSquare(piece.x + c, projectionY + r, VACANT); // удалить проекцию
            }
        }
    }
}

function showGameOver() {
    toggleGameOverOverlay(true);
}

function movePauseText() {
    const pauseText = document.getElementById('pause-text');

    function updatePosition() {
        pauseX += pauseSpeedX;
        pauseY += pauseSpeedY;

        // Проверка столкновений с границами
        if (pauseX <= 0 || pauseX >= canvas.width - 100) {
            pauseSpeedX *= -1;
        }
        if (pauseY <= 0 || pauseY >= canvas.height - 50) {
            pauseSpeedY *= -1;
        }

        // Обновление позиции элемента
        pauseText.style.left = `${pauseX}px`;
        pauseText.style.top = `${pauseY}px`;

        if (paused) {
            requestAnimationFrame(updatePosition);
        }
    }

    updatePosition();
}

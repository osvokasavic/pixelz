const gameContainer = document.getElementById('gameContainer');
const startButton = document.getElementById('startButton');
const colorOptions = document.getElementById('colorOptions');
const speedOptions = document.getElementById('speedOptions');
const logContainer = document.getElementById('logContainer');

let grid = [];
const gridSize = 200;
const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
let selectedColors = [];
let gameInterval;
let frameDuration = 100;
let coreGrid = [];
let coreTimers = [];
let occupationTimers = [];

const initGrid = (numColors) => {
    gameContainer.innerHTML = '';
    grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
    coreGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
    coreTimers = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    occupationTimers = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    selectedColors = colors.slice(0, numColors);

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const pixel = document.createElement('div');
            pixel.classList.add('pixel');
            gameContainer.appendChild(pixel);

            if (numColors === 2) {
                grid[y][x] = x < gridSize / 2 ? selectedColors[0] : selectedColors[1];
            } else if (numColors === 3) {
                grid[y][x] = (x < gridSize / 3) ? selectedColors[0] : ((x < 2 * gridSize / 3) ? selectedColors[1] : selectedColors[2]);
            } else if (numColors === 4) {
                grid[y][x] = (y < gridSize / 2) ?
                    (x < gridSize / 2 ? selectedColors[0] : selectedColors[1]) :
                    (x < gridSize / 2 ? selectedColors[2] : selectedColors[3]);
            }
            pixel.style.backgroundColor = grid[y][x];
        }
    }

    // Initialize cores for starting pixels
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (x < gridSize / 2 && numColors === 2) {
                coreGrid[y][x] = true;
            } else if (x < gridSize / 3 && numColors === 3) {
                coreGrid[y][x] = true;
            } else if (x < gridSize / 2 && y < gridSize / 2 && numColors === 4) {
                coreGrid[y][x] = true;
            } else if (x >= gridSize / 2 && y < gridSize / 2 && numColors === 4) {
                coreGrid[y][x] = true;
            }
        }
    }
};

const startGame = () => {
    clearInterval(gameInterval);
    const speedMultiplier = parseFloat(speedOptions.value);
    frameDuration = 100 / speedMultiplier;
    gameInterval = setInterval(gameLoop, frameDuration);
};

const getNeighbors = (x, y) => {
    const neighbors = [];
    if (x > 0) neighbors.push([x - 1, y]);
    if (x < gridSize - 1) neighbors.push([x + 1, y]);
    if (y > 0) neighbors.push([x, y - 1]);
    if (y < gridSize - 1) neighbors.push([x, y + 1]);
    return neighbors;
};

const gameLoop = () => {
    const newGrid = grid.map(arr => [...arr]);

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const currentColor = grid[y][x];
            const neighbors = getNeighbors(x, y);
            neighbors.forEach(([nx, ny]) => {
                if (grid[ny][nx] !== currentColor) {
                    if (Math.random() < 0.5) {
                        newGrid[ny][nx] = currentColor;
                        occupationTimers[ny][nx] = 0;
                    }
                }
            });
        }
    }

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (grid[y][x] !== newGrid[y][x]) {
                coreGrid[y][x] = true;
                coreTimers[y][x] = 0;
            } else if (coreGrid[y][x]) {
                coreTimers[y][x]++;
                if (coreTimers[y][x] >= 20) {
                    coreGrid[y][x] = false;
                }
            } else {
                occupationTimers[y][x]++;
                if (occupationTimers[y][x] > 3) {
                    const uprisingChance = [0.03, 0.05, 0.07][occupationTimers[y][x] - 1];
                    if (Math.random() < uprisingChance) {
                        newGrid[y][x] = grid[y][x];
                        getNeighbors(x, y).forEach(([nx, ny]) => {
                            newGrid[ny][nx] = grid[y][x];
                        });
                        logEvent(`Uprising at (${x}, ${y})`);
                    }
                }
            }
        }
    }

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const pixel = gameContainer.children[y * gridSize + x];
            pixel.style.backgroundColor = newGrid[y][x];
        }
    }

    grid = newGrid;
};

const logEvent = (message) => {
    const logEntry = document.createElement('div');
    logEntry.textContent = message;
    logContainer.appendChild(logEntry);
    if (logContainer.childElementCount > 5) {
        logContainer.removeChild(logContainer.firstChild);
    }
};

startButton.addEventListener('click', () => {
    const numColors = parseInt(colorOptions.value, 10);
    initGrid(numColors);
    startGame();
});

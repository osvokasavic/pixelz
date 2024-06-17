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
let colorStats = {};
let alliances = [];

const initGrid = (numColors) => {
    gameContainer.innerHTML = '';
    grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
    coreGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
    coreTimers = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    occupationTimers = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    selectedColors = colors.slice(0, numColors);

    colorStats = {};
    selectedColors.forEach(color => {
        colorStats[color] = {
            cores: 0,
            desperateDefense: false
        };
    });

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
            coreGrid[y][x] = true; // Initial cores
            colorStats[grid[y][x]].cores++;
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
    const attackAttempts = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const currentColor = grid[y][x];
            const neighbors = getNeighbors(x, y);

            neighbors.forEach(([nx, ny]) => {
                if (!attackAttempts[ny][nx] && grid[ny][nx] !== currentColor) {
                    let attackSuccessChance = coreGrid[ny][nx] ? 0.25 : 0.75;
                    attackSuccessChance *= getAttackModifier(currentColor, grid[ny][nx]);

                    if (Math.random() < attackSuccessChance) {
                        newGrid[ny][nx] = currentColor;
                        attackAttempts[ny][nx] = true;
                        occupationTimers[ny][nx] = 0;
                        coreGrid[ny][nx] = true;
                        coreTimers[ny][nx] = 0;
                        colorStats[grid[ny][nx]].cores--;
                        colorStats[currentColor].cores++;
                    }
                }
            });
        }
    }

    // Handle core and occupation timers
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (grid[y][x] === newGrid[y][x]) {
                if (coreGrid[y][x]) {
                    coreTimers[y][x]++;
                    if (coreTimers[y][x] >= 20) {
                        coreGrid[y][x] = false;
                    }
                } else {
                    occupationTimers[y][x]++;
                    if (occupationTimers[y][x] > 3) {
                        const uprisingChance = [0.03, 0.05, 0.07][occupationTimers[y][x] - 4];
                        if (Math.random() < uprisingChance) {
                            const originalColor = grid[y][x];
                            newGrid[y][x] = grid[y][x];
                            getNeighbors(x, y).forEach(([nx, ny]) => {
                                if (grid[ny][nx] !== originalColor) {
                                    newGrid[ny][nx] = originalColor;
                                    colorStats[originalColor].cores++;
                                    colorStats[grid[ny][nx]].cores--;
                                }
                            });
                            logEvent(`Uprising at (${x}, ${y})`);
                        }
                    }
                }
            }
        }
    }

    // Handle desperate defense buff
    for (let color in colorStats) {
        const stats = colorStats[color];
        const totalCores = stats.cores;
        const originalCores = selectedColors.includes(color) ? (gridSize * gridSize) / selectedColors.length : 0;

        if (totalCores < originalCores * 0.75) {
            stats.desperateDefense = true;
        } else {
            stats.desperateDefense = false;
        }
    }

    // Handle alliances for 3 and 4 colors
    if (selectedColors.length > 2) {
        handleAlliances();
    }

    // Update grid and DOM
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const pixel = gameContainer.children[y * gridSize + x];
            pixel.style.backgroundColor = newGrid[y][x];
        }
    }

    grid = newGrid;
};

const getAttackModifier = (attackingColor, defendingColor) => {
    let modifier = 1;
    if (colorStats[attackingColor].desperateDefense) {
        modifier -= 0.2;
    }
    if (colorStats[defendingColor].desperateDefense) {
        modifier -= 0.25;
    }
    if (alliances.includes(attackingColor) && !alliances.includes(defendingColor)) {
        modifier += 0.1;
    }
    if (alliances.includes(defendingColor) && !alliances.includes(attackingColor)) {
        modifier += 0.1;
    }
    return modifier;
};

const handleAlliances = () => {
    const sortedColors = selectedColors.slice().sort((a, b) => colorStats[a].cores - colorStats[b].cores);
    const weakestColor = sortedColors[0];
    const secondWeakestColor = sortedColors[1];
    const strongestColor = sortedColors[sortedColors.length - 1];

    if (colorStats[strongestColor].cores > colorStats[weakestColor].cores + colorStats[secondWeakestColor].cores) {
        alliances = [weakestColor, secondWeakestColor];
    } else {
        alliances = [];
    }
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

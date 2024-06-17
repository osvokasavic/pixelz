document.getElementById('startButton').addEventListener('click', startGame);

function startGame() {
    const colorOptions = document.getElementById('colorOptions').value;
    const speed = document.getElementById('speed').value;
    const gridElement = document.getElementById('grid');
    const logElement = document.getElementById('log');
    gridElement.innerHTML = ''; // Clear the grid

    const colors = generateColors(colorOptions);
    const grid = initializeGrid(colors, colorOptions);
    renderGrid(gridElement, grid);

    const frameDuration = getFrameDuration(speed);
    let frame = 0;

    setInterval(() => {
        frame++;
        logEvent(logElement, `Frame ${frame}`);
        updateGrid(grid, colors, frame, logElement);
        renderGrid(gridElement, grid);
    }, frameDuration);
}

function generateColors(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        colors.push(getRandomColor());
    }
    return colors;
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function initializeGrid(colors, colorOptions) {
    const grid = [];
    const size = 200;
    for (let y = 0; y < size; y++) {
        const row = [];
        for (let x = 0; x < size; x++) {
            if (colorOptions == 2) {
                row.push({
                    color: x < size / 2 ? colors[0] : colors[1],
                    core: x < size / 2 ? colors[0] : colors[1],
                    framesOccupied: 0,
                    framesAsCore: 0,
                });
            } else if (colorOptions == 3) {
                row.push({
                    color: x < size / 3 ? colors[0] : (x < 2 * size / 3 ? colors[1] : colors[2]),
                    core: x < size / 3 ? colors[0] : (x < 2 * size / 3 ? colors[1] : colors[2]),
                    framesOccupied: 0,
                    framesAsCore: 0,
                });
            } else {
                row.push({
                    color: x < size / 4 ? colors[0] : (x < 2 * size / 4 ? colors[1] : (x < 3 * size / 4 ? colors[2] : colors[3])),
                    core: x < size / 4 ? colors[0] : (x < 2 * size / 4 ? colors[1] : (x < 3 * size / 4 ? colors[2] : colors[3])),
                    framesOccupied: 0,
                    framesAsCore: 0,
                });
            }
        }
        grid.push(row);
    }
    return grid;
}

function renderGrid(gridElement, grid) {
    gridElement.innerHTML = '';
    grid.forEach(row => {
        row.forEach(pixel => {
            const pixelElement = document.createElement('div');
            pixelElement.className = 'pixel';
            pixelElement.style.backgroundColor = pixel.color;
            gridElement.appendChild(pixelElement);
        });
    });
}

function getFrameDuration(speed) {
    if (speed == '0.5') return 200;
    if (speed == '1') return 100;
    if (speed == '1.5') return 75;
    if (speed == '2') return 50;
}

function updateGrid(grid, colors, frame, logElement) {
    const size = 200;
    const changes = [];

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const pixel = grid[y][x];
            if (pixel.framesAsCore > 0) {
                pixel.framesAsCore--;
            }
            if (pixel.framesOccupied > 0) {
                pixel.framesOccupied--;
            }

            if (pixel.framesOccupied === 0) {
                pixel.core = null;
            } else if (pixel.framesOccupied <= 0 && pixel.color !== pixel.core) {
                if (Math.random() < 0.03 * (pixel.framesOccupied + 1)) {
                    logEvent(logElement, `Uprising at (${x}, ${y})`);
                    changes.push(...getNeighboringPixels(grid, x, y, pixel.color));
                }
            }

            const neighbors = getNeighboringPixels(grid, x, y, pixel.color);
            if (neighbors.length > 0) {
                const target = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (Math.random() < 0.5) {
                    const targetPixel = grid[target.y][target.x];
                    const success = Math.random() < (targetPixel.core ? 0.75 : 0.5);
                    if (success) {
                        logEvent(logElement, `Attack at (${target.x}, ${target.y})`);
                        changes.push({ x: target.x, y: target.y, color: pixel.color });
                        targetPixel.core = pixel.color;
                        targetPixel.framesOccupied = 6;
                    }
                }
            }
        }
    }

    changes.forEach(change => {
        const pixel = grid[change.y][change.x];
        pixel.color = change.color;
        pixel.core = change.color;
        pixel.framesOccupied = 6;
        pixel.framesAsCore = 20;
    });
}

function getNeighboringPixels(grid, x, y, color) {
    const neighbors = [];
    if (x > 0 && grid[y][x - 1].color !== color && !grid[y][x - 1].core) {
        neighbors.push({ x: x - 1, y: y });
    }
    if (x < 199 && grid[y][x + 1].color !== color && !grid[y][x + 1].core) {
        neighbors.push({ x: x + 1, y: y });
    }
    if (y > 0 && grid[y - 1][x].color !== color && !grid[y - 1][x].core) {
        neighbors.push({ x: x, y: y - 1 });
    }
    if (y < 199 && grid[y + 1][x].color !== color && !grid[y + 1][x].core) {
        neighbors.push({ x: x, y: y + 1 });
    }
    return neighbors;
}

function logEvent(logElement, event) {
    const eventElement = document.createElement('div');
    eventElement.textContent = event;
    logElement.appendChild(eventElement);
    logElement.scrollTop = logElement.scrollHeight;
}

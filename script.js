const gridSize = 200;
const pixelGrid = document.getElementById('pixel-grid');
const startButton = document.getElementById('start-btn');
const speedSelect = document.getElementById('speed-select');

const colors = ['#FF0000', '#0000FF'];
let pixels = [];
let speed = 0.2;

const createGrid = () => {
    for (let y = 0; y < gridSize; y++) {
        pixels[y] = [];
        for (let x = 0; x < gridSize; x++) {
            const pixel = document.createElement('div');
            pixel.classList.add('pixel');
            pixel.style.backgroundColor = x < gridSize / 2 ? colors[0] : colors[1];
            pixel.dataset.color = x < gridSize / 2 ? 0 : 1;
            pixel.dataset.debuff = 0;
            pixels[y][x] = pixel;
            pixelGrid.appendChild(pixel);
        }
    }
};

const getNeighbors = (x, y) => {
    const neighbors = [];
    if (x > 0) neighbors.push([x - 1, y]);
    if (x < gridSize - 1) neighbors.push([x + 1, y]);
    if (y > 0) neighbors.push([x, y - 1]);
    if (y < gridSize - 1) neighbors.push([x, y + 1]);
    return neighbors;
};

const fight = (x, y) => {
    const pixel = pixels[y][x];
    const color = pixel.dataset.color;
    const neighbors = getNeighbors(x, y);
    neighbors.forEach(([nx, ny]) => {
        const neighborPixel = pixels[ny][nx];
        const neighborColor = neighborPixel.dataset.color;
        if (color !== neighborColor) {
            let chance = 0.5;
            if (neighborPixel.dataset.debuff > 0) {
                chance = 0.75;
            } else if (neighborPixel.dataset.conquerAttempts) {
                chance += 0.1 * neighborPixel.dataset.conquerAttempts;
            }
            if (Math.random() < chance) {
                neighborPixel.style.backgroundColor = colors[color];
                neighborPixel.dataset.color = color;
                neighborPixel.dataset.conquerAttempts = 0;
                neighborPixel.dataset.debuff = 6;
            } else {
                neighborPixel.dataset.conquerAttempts = (neighborPixel.dataset.conquerAttempts || 0) + 1;
            }
        }
    });
};

const updateDebuffs = () => {
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const pixel = pixels[y][x];
            if (pixel.dataset.debuff > 0) {
                pixel.dataset.debuff--;
            }
        }
    }
};

const runFrame = () => {
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            fight(x, y);
        }
    }
    updateDebuffs();
};

let interval;

startButton.addEventListener('click', () => {
    clearInterval(interval);
    interval = setInterval(runFrame, speed * 1000);
});

speedSelect.addEventListener('change', (event) => {
    speed = parseFloat(event.target.value) * 0.2;
    clearInterval(interval);
    interval = setInterval(runFrame, speed * 1000);
});

createGrid();

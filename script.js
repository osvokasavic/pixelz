const gridSize = 200;
const pixelGrid = document.getElementById('pixel-grid');
const startButton = document.getElementById('start-btn');
const speedSelect = document.getElementById('speed-select');
const notifications = document.getElementById('notifications');

const colors = ['#FF0000', '#0000FF'];
let pixels = [];
let speed = 0.2;
let coreCounts = [0, 0];
let moraleBoost = [0, 0]; // Morale boost countdown

const createGrid = () => {
    for (let y = 0; y < gridSize; y++) {
        pixels[y] = [];
        for (let x = 0; x < gridSize; x++) {
            const pixel = document.createElement('div');
            pixel.classList.add('pixel');
            const colorIndex = x < gridSize / 2 ? 0 : 1;
            pixel.style.backgroundColor = colors[colorIndex];
            pixel.dataset.color = colorIndex;
            pixel.dataset.debuff = 0;
            pixel.dataset.core = (x < gridSize / 2 && colorIndex === 0) || (x >= gridSize / 2 && colorIndex === 1) ? 1 : 0; // Only starting pixels are cores
            if (pixel.dataset.core == 1) coreCounts[colorIndex]++;
            pixel.dataset.revolt = 0;
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

const getExtendedNeighbors = (x, y) => {
    const extendedNeighbors = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (x + dx >= 0 && x + dx < gridSize && y + dy >= 0 && dy < gridSize) {
                extendedNeighbors.push([x + dx, y + dy]);
            }
        }
    }
    return extendedNeighbors;
};

const fight = (x, y) => {
    const pixel = pixels[y][x];
    const color = parseInt(pixel.dataset.color);
    const neighbors = getNeighbors(x, y);
    neighbors.forEach(([nx, ny]) => {
        const neighborPixel = pixels[ny][nx];
        const neighborColor = parseInt(neighborPixel.dataset.color);
        if (color !== neighborColor) {
            let chance = 0.5;
            if (neighborPixel.dataset.debuff > 0) {
                chance = 0.75;
            } else if (neighborPixel.dataset.conquerAttempts) {
                chance += 0.1 * neighborPixel.dataset.conquerAttempts;
            }

            // Apply morale boost
            if (moraleBoost[color] > 0) {
                chance *= 1.8; // 80% attack boost
            }

            if (Math.random() < chance) {
                neighborPixel.style.backgroundColor = colors[color];
                neighborPixel.dataset.color = color;
                neighborPixel.dataset.conquerAttempts = 0;
                neighborPixel.dataset.debuff = 6;
                neighborPixel.dataset.core = 0; // Not a core until stabilized
                neighborPixel.dataset.revolt = 3; // Set revolt period
                addNotification(`${colors[color]} captured a pixel!`);
            } else {
                neighborPixel.dataset.conquerAttempts = (neighborPixel.dataset.conquerAttempts || 0) + 1;
            }
        }
    });
};

const handleRevolt = (x, y) => {
    const pixel = pixels[y][x];
    const color = parseInt(pixel.dataset.color);
    const originalColor = (color + 1) % 2; // Opposite color
    if (pixel.dataset.revolt > 0) {
        const chance = 0.1 * (4 - pixel.dataset.revolt); // 10%, 15%, 20%
        const extendedNeighbors = getExtendedNeighbors(x, y);
        extendedNeighbors.forEach(([ex, ey]) => {
            const extendedPixel = pixels[ey][ex];
            if (Math.random() < chance && parseInt(extendedPixel.dataset.color) === originalColor) {
                pixel.style.backgroundColor = colors[originalColor];
                pixel.dataset.color = originalColor;
                pixel.dataset.debuff = 6;
                pixel.dataset.core = 0;
                pixel.dataset.revolt = 0;
                addNotification(`${colors[originalColor]} revolted and recaptured a pixel!`);
            }
        });
        pixel.dataset.revolt--;
    }
};

const updateDebuffs = () => {
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const pixel = pixels[y][x];
            if (pixel.dataset.debuff > 0) {
                pixel.dataset.debuff--;
            } else if (pixel.dataset.core === '0') {
                pixel.dataset.core = 1; // Stabilize the pixel as core
                addNotification(`${colors[pixel.dataset.color]} stabilized a core!`);
            }
        }
    }
};

const checkMorale = () => {
    for (let color = 0; color < 2; color++) {
        const currentCoreCount = pixels.flat().filter(pixel => parseInt(pixel.dataset.color) === color && pixel.dataset.core === '1').length;
        if (currentCoreCount < 0.75 * coreCounts[color]) {
            moraleBoost[color] = 10; // 10 frames morale boost
            addNotification(`${colors[color]} gained a morale boost!`);
        }
    }
};

const applyMoraleBoost = () => {
    for (let color = 0; color < 2; color++) {
        if (moraleBoost[color] > 0) {
            moraleBoost[color]--;
        }
    }
};

const runFrame = () => {
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            fight(x, y);
            handleRevolt(x, y);
        }
    }
    updateDebuffs();
    checkMorale();
    applyMoraleBoost();
};

const addNotification = (message) => {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;
    notifications.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
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

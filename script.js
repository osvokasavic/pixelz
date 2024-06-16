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
let notificationsCounter = {};
let frameCount = 0;

const createGrid = () => {
    pixelGrid.innerHTML = '';
    pixels = [];
    coreCounts = [0, 0];
    moraleBoost = [0, 0];
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
            if (x + dx >= 0 && x + dx < gridSize && y + dy >= 0 && y + dy < gridSize) {
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
                chance = Math.min(0.5 + 0.1 * neighborPixel.dataset.conquerAttempts, 0.6);
            }

            // Apply morale boost
            if (moraleBoost[color] > 0) {
                chance = 1; // 100% attack boost
            }

            if (Math.random() < chance) {
                neighborPixel.style.backgroundColor = colors[color];
                neighborPixel.dataset.color = color;
                neighborPixel.dataset.conquerAttempts = 0;
                neighborPixel.dataset.debuff = 6;
                neighborPixel.dataset.core = 0; // Not a core until stabilized
                neighborPixel.dataset.revolt = 3; // Set revolt period
                addNotification(`${colors[color]} captured a pixel!`, color);
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
                addNotification(`${colors[originalColor]} revolted and recaptured a pixel!`, originalColor);
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
                addNotification(`${colors[pixel.dataset.color]} stabilized a core!`, parseInt(pixel.dataset.color));
            }
        }
    }
};

const checkMorale = () => {
    for (let color = 0; color < 2; color++) {
        const currentCoreCount = pixels.flat().filter(pixel => parseInt(pixel.dataset.color) === color && pixel.dataset.core === '1').length;
        if (currentCoreCount < 0.75 * coreCounts[color]) {
            if (moraleBoost[color] === 0) {
                addNotification(`${colors[color]} gained a morale boost!`, color);
            }
            moraleBoost[color] = 10; // Reset morale boost to 10 frames
        } else if (moraleBoost[color] > 0) {
            moraleBoost[color]--; // Decrease morale boost counter if condition is no longer true
        }
    }
};

const checkVictory = () => {
    const allPixels = pixels.flat();
    const redPixels = allPixels.filter(pixel => parseInt(pixel.dataset.color) === 0).length;
    const bluePixels = allPixels.filter(pixel => parseInt(pixel.dataset.color) === 1).length;

    if (redPixels === 0 || bluePixels === 0) {
        clearInterval(interval);
        displayStatistics(redPixels, bluePixels);
    }
};

const displayStatistics = (redPixels, bluePixels) => {
    const message = redPixels > 0 ? "Red Wins!" : "Blue Wins!";
    const stats = `
        <h2>${message}</h2>
        <p>Red Pixels: ${redPixels}</p>
        <p>Blue Pixels: ${bluePixels}</p>
    `;
    notifications.innerHTML = stats;
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
    checkVictory();
    frameCount++;
};

const addNotification = (message, colorIndex) => {
    if (!notificationsCounter[message]) {
        notificationsCounter[message] = { count: 1, element: null };
    } else {
        notificationsCounter[message].count++;
    }

    if (notificationsCounter[message].element) {
        notificationsCounter[message].element.textContent = `${message} x${notificationsCounter[message].count}`;
    } else {
        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.textContent = message;
        notifications.appendChild(notification);
        notificationsCounter[message].element = notification;
    }

    clearTimeout(notificationsCounter[message].timeout);
    notificationsCounter[message].timeout = setTimeout(() => {
        if (notificationsCounter[message].element) {
            notificationsCounter[message].element.remove();
        }
        delete notificationsCounter[message];
    }, 100000);
};

let interval;

startButton.addEventListener('click', () => {
    clearInterval(interval);
    notifications.innerHTML = '';
    notificationsCounter = {};
    createGrid();
    interval = setInterval(runFrame, speed * 1000);
});

speedSelect.addEventListener('change', (event) => {
    speed = parseFloat(event.target.value) * 0.05;
    clearInterval(interval);
    interval = setInterval(runFrame, speed * 1000);
});

createGrid();

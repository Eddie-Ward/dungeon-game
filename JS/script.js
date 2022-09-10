"use strict";
class Sprite {
    _type;
    constructor(_type) {
        this._type = _type;
    }
    get type() {
        return this._type;
    }
    src() {
        return `./SRC/SVG/${this.type}-svgrepo-com.svg`;
    }
    style() {
        return `svg-${this.type}`;
    }
    alt(value) {
        return `${this.type} with ${value} HP`;
    }
}
class Tile {
    _pos;
    _content;
    _value;
    constructor(_pos, _content, _value) {
        this._pos = _pos;
        this._content = _content;
        this._value = _value;
    }
    get pos() {
        return this._pos;
    }
    get content() {
        return this._content;
    }
    get value() {
        return this._value;
    }
}
const START = { y: 0, x: 0 };
const STATUSES = {
    TIME: 0,
    HP: 1,
    SCORE: 2,
};
const spider = new Sprite("spider");
const orc = new Sprite("orc");
const reaper = new Sprite("reaper");
const dragon = new Sprite("dragon");
const ENEMIES = [spider, orc, reaper, dragon];
const meat = new Sprite("meat");
const potion = new Sprite("potion");
const HEALTH = [meat, potion];
const knight = new Sprite("knight");
const treasure = new Sprite("treasure");
const GOAL = [treasure];
const TILE_CONTENT = ["enemy", "potion"];
const inputStartingHP = 10;
const inputContent = [
    ["start", "potion", "enemy", "potion"],
    ["enemy", "enemy", "potion", "enemy"],
    ["enemy", "enemy", "enemy", "enemy"],
    ["potion", "enemy", "enemy", "finish"],
];
const inputValues = [
    [inputStartingHP, 1, 7, 2],
    [4, 1, 4, 10],
    [6, 2, 9, 3],
    [9, 3, 8, 0],
];
// Query select DOM elements
const statusesEl = document.querySelectorAll(".js-status");
const gridEl = document.querySelector(".js-grid");
const gameSectionEl = document.querySelector(".js-game-section");
const btnsResetEl = document.querySelectorAll(".js-btn-reset");
const btnsNewEl = document.querySelectorAll(".js-btn-new");
const btnHintEl = document.querySelector(".js-btn-hint");
const btnDiffEl = document.querySelector(".js-btn-diff");
const victoryScreenEl = document.querySelector(".js-victory");
// Initialize global variables
let currentPos = START;
let diffWeight = [0.75, 0.25];
let maxValueEnemy = 16;
let maxValueHealth = 8;
let enemiesRank = Math.floor(maxValueEnemy / ENEMIES.length);
let healthRank = Math.floor(maxValueHealth / HEALTH.length);
// Create matrix and knight in model
let currentGrid = createGrid(4, 4);
let currentHP = calcStartHP(currentGrid);
let knightEl = createKnight(knight);
// currentGrid.forEach((row) => {
// 	row.forEach((tile) => {
// 		console.log(`${tile.content} at [${tile.pos.x}, ${tile.pos.y}] with ${tile.value}`);
// 	});
// });
// Render grid and current HP to DOM
renderGrid(currentGrid, gridEl);
statusesEl[STATUSES.HP].innerText = `HP Remaining: ${currentHP}`;
// Add event listeners
gridEl.addEventListener("click", onTileClick);
for (const btn of btnsResetEl) {
    btn.addEventListener("click", resetBoard);
}
for (const btn of btnsNewEl) {
    btn.addEventListener("click", newBoard);
}
function randWeight(weight) {
    let random = Math.random();
    for (let i = 0; i < weight.length; i++) {
        if (random < weight[i]) {
            return i;
        }
        else {
            random -= weight[i];
        }
    }
    return 0;
}
function randRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
function createGrid(row, col) {
    const gameMatrix = [];
    for (let i = 0; i < row; i++) {
        const gameRow = [];
        for (let j = 0; j < col; j++) {
            let tile;
            if (i === START.y && j === START.x) {
                tile = new Tile(START, "start", 0);
            }
            else if (i === row - 1 && j === col - 1) {
                tile = new Tile({ y: i, x: j }, "finish", 0);
            }
            else {
                const index = randWeight(diffWeight);
                const maxValues = [maxValueEnemy, maxValueHealth];
                tile = new Tile({ y: i, x: j }, TILE_CONTENT[index], randRange(1, maxValues[index]));
            }
            if (tile) {
                gameRow.push(tile);
            }
            else {
                alert("Failed to generate tile");
            }
        }
        gameMatrix.push(gameRow);
    }
    return gameMatrix;
}
function calcStartHP(grid) {
    const n = grid[0].length;
    const m = grid.length;
    const row = new Array(n + 1);
    const dp = new Array(m + 1);
    dp.fill(row.fill(Infinity));
    for (let y = m - 1; y >= 0; y--) {
        for (let x = n - 1; x >= 0; x--) {
            if (y === m - 1 && x === n - 1) {
                dp[y][x] = 0;
            }
            else {
                const value = grid[y][x].content === "enemy" ? grid[y][x].value : grid[y][x].value * -1;
                dp[y][x] = Math.max(value, value + Math.min(dp[y + 1][x], dp[y][x + 1]));
                console.log(`[${x + 1}][${y + 1}] is ${dp[y][x]}`);
            }
        }
    }
    return dp[0][0] + 1;
}
function createKnight(sprite) {
    const knightContainer = document.createElement("div");
    const knightSVG = document.createElement("img");
    const knightHP = document.createElement("p");
    knightSVG.src = knight.src();
    knightSVG.classList.add(knight.style());
    knightSVG.alt = knight.alt(currentHP);
    knightHP.innerText = currentHP.toString();
    knightHP.classList.add("text-value-knight");
    knightContainer.appendChild(knightSVG);
    knightContainer.appendChild(knightHP);
    knightContainer.classList.add("container-knight");
    return knightContainer;
}
function renderSprite(imgElement, sprites, index, value) {
    imgElement.src = sprites[index].src();
    if (value) {
        imgElement.alt = sprites[index].alt(value);
    }
    else {
        imgElement.alt = sprites[index].toString();
    }
    imgElement.classList.add(sprites[index].style());
    return imgElement;
}
function renderTile(tile) {
    const container = document.createElement("div");
    let svgSprite = document.createElement("img");
    let valueText = document.createElement("p");
    container.dataset.X = tile.pos.x.toString();
    container.dataset.Y = tile.pos.y.toString();
    if (tile.content === "enemy") {
        svgSprite = renderSprite(svgSprite, ENEMIES, Math.floor(tile.value / enemiesRank), tile.value);
        valueText.innerText = `-${tile.value}`;
        valueText.classList.add("text-value-enemy");
        container.classList.add("tile-enemy");
    }
    else if (tile.content === "potion") {
        svgSprite = renderSprite(svgSprite, HEALTH, Math.floor(tile.value / healthRank), tile.value);
        valueText.innerText = `+${tile.value}`;
        valueText.classList.add("text-value-health");
        container.classList.add("tile-health");
    }
    else if (tile.content === "start") {
        //Add start text to the tile if it is the start tile
        valueText.innerText = `Start`;
        valueText.classList.add("text-value-start");
        container.classList.add("tile-start");
        container.classList.add("tile-selected");
    }
    else if (tile.content === "finish") {
        //Add treasure chest to the tile if it is the finish tile
        svgSprite = renderSprite(svgSprite, GOAL, 0);
        valueText.innerText = "Goal";
        valueText.classList.add("text-value-goal");
        container.classList.add("tile-finish");
    }
    if (tile.content === "start") {
        //Add knight to the tile if it is the start tile
        container.appendChild(knightEl);
    }
    else {
        container.appendChild(svgSprite);
    }
    container.appendChild(valueText);
    return container;
}
function renderGrid(matrix, grid_element) {
    grid_element.style.gridTemplateColumns = `repeat(${matrix[0].length}, 1fr)`;
    grid_element.style.gridTemplateRows = `repeat(${matrix.length}, 1fr)`;
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[0].length; j++) {
            const tile = matrix[i][j];
            const displayTile = renderTile(tile);
            displayTile.style.gridColumnStart = (j + 1).toString();
            displayTile.style.gridRowStart = (i + 1).toString();
            grid_element.appendChild(displayTile);
        }
    }
}
function renderVictory() {
    console.log("Victory!");
    if (victoryScreenEl.classList.contains("js-off")) {
        victoryScreenEl.classList.remove("js-off");
    }
}
function renderKnight(direction, target) {
    knightEl.classList.add(`knight-${direction}`);
    const updateKnight = function () {
        knightEl.classList.remove(`knight-${direction}`);
        target.appendChild(knightEl);
    };
    setTimeout(updateKnight, 500);
    const knightHP = knightEl.lastElementChild;
    knightHP.innerText = currentHP.toString();
}
function moveIsValid(curPos, movePos) {
    if (movePos.x - curPos.x === 1 && movePos.y === curPos.y) {
        return "right";
    }
    else if (movePos.x === curPos.x && movePos.y - curPos.y === 1) {
        return "down";
    }
    return false;
}
function processHP(curHP, curPos, movePos, matrixGrid) {
    let newHP = curHP;
    if (matrixGrid[movePos.y][movePos.x].content === "enemy") {
        newHP -= matrixGrid[movePos.y][movePos.x].value;
        if (newHP <= 0) {
            return false;
        }
    }
    else if (matrixGrid[movePos.y][movePos.x].content === "potion") {
        newHP += matrixGrid[movePos.y][movePos.x].value;
    }
    return newHP;
}
function onTileClick(event) {
    let target = event.target;
    if ((target.tagName === "IMG" || target.tagName === "P") &&
        !target.parentElement?.classList.contains("container-knight")) {
        target = target.parentElement;
    }
    if (target && target.dataset.X) {
        const targetPos = { y: parseInt(target.dataset.Y), x: parseInt(target.dataset.X) };
        const direction = moveIsValid(currentPos, targetPos);
        if (direction) {
            const newHP = processHP(currentHP, currentPos, targetPos, currentGrid);
            if (newHP) {
                currentPos = targetPos;
                currentHP = newHP;
                renderKnight(direction, target);
                statusesEl[STATUSES.HP].innerText = `HP Remaining: ${currentHP}`;
                target.classList.add("tile-selected");
                if (target.classList.contains("tile-finish")) {
                    renderVictory();
                }
            }
            else {
                alert("HP too low to move there!");
            }
        }
        else {
            alert("Can't move there!");
        }
    }
}
function resetBoard() {
    if (!victoryScreenEl.classList.contains("js-off")) {
        victoryScreenEl.classList.add("js-off");
    }
    // Reset position and HP
    currentPos = START;
    currentHP = calcStartHP(currentGrid);
    // Deleting the existing grid on the DOM
    while (gridEl.firstChild) {
        gridEl.removeChild(gridEl.firstChild);
    }
    // Recreate knight element, but not assigned to any children yet.
    knightEl = createKnight(knight);
    // Render new grid on DOM, with knight element
    renderGrid(currentGrid, gridEl);
    // Render HP on DOM
    statusesEl[STATUSES.HP].innerText = `HP Remaining: ${currentHP}`;
}
function newBoard() {
    currentGrid = createGrid(4, 4);
    resetBoard();
}

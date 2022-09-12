"use strict";
// Classes
class Level {
    _index;
    _dimGrid;
    _randWeight;
    _maxValueEnemy;
    _maxValueHealth;
    _scoreMulti;
    _hints;
    constructor(_index, _dimGrid, _randWeight, _maxValueEnemy, _maxValueHealth, _scoreMulti, _hints) {
        this._index = _index;
        this._dimGrid = _dimGrid;
        this._randWeight = _randWeight;
        this._maxValueEnemy = _maxValueEnemy;
        this._maxValueHealth = _maxValueHealth;
        this._scoreMulti = _scoreMulti;
        this._hints = _hints;
    }
    get index() {
        return this._index;
    }
    get dimGrid() {
        return this._dimGrid;
    }
    get randWeight() {
        return this._randWeight;
    }
    get maxValueEnemy() {
        return this._maxValueEnemy;
    }
    get maxValueHealth() {
        return this._maxValueHealth;
    }
    get scoreMulti() {
        return this._scoreMulti;
    }
    get hints() {
        return this._hints;
    }
}
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
class Arrow extends Sprite {
    _type;
    constructor(_type) {
        super(_type);
        this._type = _type;
    }
    altDir(dir) {
        return `A ${dir} arrow`;
    }
}
class Tile {
    _pos;
    _content;
    _value;
    _dir;
    constructor(_pos, _content, _value, _dir) {
        this._pos = _pos;
        this._content = _content;
        this._value = _value;
        this._dir = _dir;
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
    get dir() {
        return this._dir;
    }
    set dir(value) {
        this._dir = value;
    }
}
// Global constants
const START = { y: 0, x: 0 };
const ARROW_INDEX = {
    DOWN: 0,
    RIGHT: 1,
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
const downArrow = new Arrow("down-arrow");
const rightArrow = new Arrow("right-arrow");
const ARROWS = [downArrow, rightArrow];
const TILE_CONTENT = ["enemy", "potion"];
const LVL_NAMES = ["Easy", "Med", "Hard"];
const EASY = new Level(0, 4, [0.7, 0.3], 16, 8, 0.9, 1);
const MEDIUM = new Level(1, 6, [0.775, 0.225], 20, 6, 1.1, 3);
const HARD = new Level(2, 8, [0.85, 0.15], 32, 4, 2, 3);
const levels = [EASY, MEDIUM, HARD];
// Query select DOM elements
const healthEl = document.querySelector(".js-status");
const gridParentEl = document.querySelector(".js-grid");
const btnsResetEl = document.querySelectorAll(".js-btn-reset");
const btnsNewEl = document.querySelectorAll(".js-btn-new");
const btnHintEl = document.querySelector(".js-btn-hint");
const btnDiffEl = document.querySelector(".js-btn-diff");
const modalScreenEl = document.querySelector(".js-modal");
const modalHeaderEl = document.querySelector(".js-modal-header");
const modalMessageEl = document.querySelector(".js-modal-message");
// Initialize global variables
let currentPos = START;
let currentHP = 0;
let currentLevel = levels[0];
let curMaxEnemy = currentLevel.maxValueEnemy;
let curMaxHealth = currentLevel.maxValueHealth;
let enemiesRank = Math.floor(curMaxEnemy / ENEMIES.length);
let healthRank = Math.floor(curMaxHealth / HEALTH.length);
// Create matrix and knight in model
let currentGrid = createGrid(currentLevel.dimGrid, currentLevel.dimGrid);
[currentHP, currentGrid] = calcGrid(currentGrid);
let knightEl = createKnight(knight);
// Render grid and current HP to DOM
let renderTilesEl = renderGrid(currentGrid, gridParentEl);
let nextValidTilesEl = renderNextValid(currentPos, [], renderTilesEl);
healthEl.innerText = `HP: ${currentHP}`;
storePath(renderTilesEl, currentGrid);
// Add event listeners
gridParentEl.addEventListener("click", onTileClick);
for (const btn of btnsResetEl) {
    btn.addEventListener("click", resetBoard);
}
for (const btn of btnsNewEl) {
    btn.addEventListener("click", newBoard);
}
btnDiffEl.addEventListener("click", changeLevel);
btnDiffEl.addEventListener("mouseover", () => {
    btnDiffEl.innerText = `Try ${LVL_NAMES[currentLevel.index === 2 ? 0 : currentLevel.index + 1]}`;
});
btnDiffEl.addEventListener("mouseout", () => {
    btnDiffEl.innerText = `Level: ${LVL_NAMES[currentLevel.index]}`;
});
btnHintEl.addEventListener("click", renderHint);
//Functions
//Random number generators
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
//Create objects on model
function createGrid(row, col) {
    // console.log(`Generating ${row} by ${col} grid`);
    const gameMatrix = [];
    for (let i = 0; i < row; i++) {
        const gameRow = [];
        for (let j = 0; j < col; j++) {
            let tile;
            if (i === START.y && j === START.x) {
                tile = new Tile(START, "start", 0, null);
            }
            else if (i === row - 1 && j === col - 1) {
                tile = new Tile({ y: i, x: j }, "finish", 0, null);
            }
            else {
                const index = randWeight(currentLevel.randWeight);
                const maxValues = [curMaxEnemy, curMaxHealth];
                tile = new Tile({ y: i, x: j }, TILE_CONTENT[index], randRange(1, maxValues[index]), null);
            }
            if (tile) {
                gameRow.push(tile);
            }
            else {
                console.log("Failed to generate tile");
            }
        }
        gameMatrix.push(gameRow);
    }
    return gameMatrix;
}
function calcGrid(grid) {
    const n = grid[0].length;
    const m = grid.length;
    const row = new Array(n + 1);
    const dp = new Array(m + 1);
    dp.fill(row.fill(Infinity));
    for (let row = m - 1; row >= 0; row--) {
        const pathsRow = [];
        for (let col = n - 1; col >= 0; col--) {
            if (row === m - 1 && col === n - 1) {
                dp[row][col] = 0;
            }
            else {
                const value = grid[row][col].content === "enemy" ? grid[row][col].value : grid[row][col].value * -1;
                const down = dp[row + 1][col];
                const right = dp[row][col + 1];
                if (down < right) {
                    grid[row][col].dir = "down";
                    dp[row][col] = Math.max(value, value + down);
                }
                else {
                    grid[row][col].dir = "right";
                    dp[row][col] = Math.max(value, value + right);
                }
            }
        }
    }
    return [dp[0][0] + 3 - currentLevel.index, grid];
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
//Render objects for view
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
    let svgArrow = document.createElement("img");
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
    if (tile.dir && tile.dir !== "end") {
        if (tile.dir === "right") {
            svgArrow = renderSprite(svgArrow, ARROWS, ARROW_INDEX.RIGHT);
            svgArrow.alt = rightArrow.altDir("right");
        }
        else {
            svgArrow = renderSprite(svgArrow, ARROWS, ARROW_INDEX.DOWN);
            svgArrow.alt = rightArrow.altDir("down");
        }
        container.appendChild(svgArrow);
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
function renderGrid(matrix, gridParentEl) {
    const renderTilesEl = [];
    gridParentEl.style.gridTemplateColumns = `repeat(${matrix[0].length}, 1fr)`;
    gridParentEl.style.gridTemplateRows = `repeat(${matrix.length}, 1fr)`;
    for (let i = 0; i < matrix.length; i++) {
        const renderRowEl = [];
        for (let j = 0; j < matrix[0].length; j++) {
            const tile = matrix[i][j];
            const displayTile = renderTile(tile);
            displayTile.style.gridColumnStart = (j + 1).toString();
            displayTile.style.gridRowStart = (i + 1).toString();
            gridParentEl.appendChild(displayTile);
            renderRowEl.push(displayTile);
        }
        renderTilesEl.push(renderRowEl);
    }
    return renderTilesEl;
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
function renderShake(target) {
    function removeShake() {
        if (target?.classList.contains("js-shake")) {
            target.classList.remove("js-shake");
        }
    }
    removeShake();
    target?.classList.add("js-shake");
    setTimeout(removeShake, 500);
}
function renderNextValid(curPos, curValid, renderTilesEl) {
    curValid.forEach((tileEl) => {
        tileEl.classList.remove("tile-next");
    });
    const [n, m] = [renderTilesEl[0].length, renderTilesEl.length];
    if (curPos.y === m - 1) {
        // console.log(`Currently at max ${curPos.y}`);
        if (curPos.x === n - 1) {
            return [];
        }
        curValid = [renderTilesEl[curPos.y][curPos.x + 1]];
    }
    else if (curPos.x === n - 1) {
        // console.log(`Currently at max ${curPos.x}`);
        curValid = [renderTilesEl[curPos.y + 1][curPos.x]];
    }
    else {
        // console.log(`Currently at ${curPos.y}, ${curPos.x}`);
        curValid = [renderTilesEl[curPos.y][curPos.x + 1], renderTilesEl[curPos.y + 1][curPos.x]];
    }
    curValid.forEach((tileEl) => {
        tileEl.classList.add("tile-next");
    });
    // console.log(curValid);
    return curValid;
}
function renderVictory() {
    console.log("Victory!");
    modalHeaderEl.innerText = "Congratulations!";
    modalMessageEl.innerText = `You reached the goal with ${currentHP} HP remaining!`;
    if (!modalScreenEl.open) {
        modalScreenEl.showModal();
    }
    // if (modalScreenEl.classList.contains("js-off")) {
    // 	modalScreenEl.classList.remove("js-off");
    // }
}
function renderDefeat() {
    console.log("Defeat");
    modalHeaderEl.innerText = "Game Over!";
    modalMessageEl.innerText = `You have 0 HP remaining!`;
    if (!modalScreenEl.open) {
        modalScreenEl.showModal();
    }
}
function storePath(renderTilesEl, path) {
    const pathTilesEl = [];
    let [i, j] = [0, 0];
    let curDir = path[i][j].dir;
    while (curDir) {
        pathTilesEl.push({ pos: { y: i, x: j }, tileEl: renderTilesEl[i][j] });
        [i, j] = curDir === "down" ? [i + 1, j] : [i, j + 1];
        curDir = path[i][j].dir;
    }
    return pathTilesEl;
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
            return 0;
        }
    }
    else if (matrixGrid[movePos.y][movePos.x].content === "potion") {
        newHP += matrixGrid[movePos.y][movePos.x].value;
    }
    return newHP;
}
// Callback functions for listeners
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
            currentPos = targetPos;
            currentHP = newHP;
            renderKnight(direction, target);
            healthEl.innerText = `HP: ${currentHP}`;
            target.classList.add("tile-selected");
            if (currentHP > 0) {
                nextValidTilesEl = renderNextValid(currentPos, nextValidTilesEl, renderTilesEl);
                if (target.classList.contains("tile-finish")) {
                    renderVictory();
                }
            }
            else {
                renderDefeat();
            }
        }
        else {
            renderShake(knightEl);
        }
    }
}
function resetBoard() {
    if (modalScreenEl.open) {
        modalScreenEl.close();
    }
    // Reset position and HP
    currentPos = START;
    [currentHP, currentGrid] = calcGrid(currentGrid);
    // Deleting the existing grid on the DOM
    while (gridParentEl.firstChild) {
        gridParentEl.removeChild(gridParentEl.firstChild);
    }
    // Recreate knight element, but not assigned to any children yet.
    knightEl = createKnight(knight);
    // Render new grid on DOM, with knight element
    renderTilesEl = renderGrid(currentGrid, gridParentEl);
    nextValidTilesEl = renderNextValid(currentPos, nextValidTilesEl, renderTilesEl);
    storePath(renderTilesEl, currentGrid);
    // Render HP on DOM
    healthEl.innerText = `HP: ${currentHP}`;
}
function newBoard() {
    currentGrid = createGrid(currentLevel.dimGrid, currentLevel.dimGrid);
    resetBoard();
}
function pickHints(curPos, curLevel, pathTilesEl) {
    const validTiles = pathTilesEl.filter((pathTile) => {
        if (pathTile.pos.x >= curPos.x && pathTile.pos.y >= curPos.y) {
            if (pathTile.pos.x === curPos.x && pathTile.pos.y === curPos.y) {
                return false;
            }
            return true;
        }
    });
    console.log("validTiles", validTiles);
    const tilesShown = [];
    if (curLevel.hints >= validTiles.length) {
        console.log("validTiles", validTiles);
        return validTiles;
    }
    else {
        while (tilesShown.length < curLevel.hints) {
            const index = randRange(0, validTiles.length);
            tilesShown.push(validTiles.splice(index, 1)[0]);
        }
    }
    console.log("tilesShown", tilesShown);
    return tilesShown;
}
function renderHint() {
    const pathTilesEl = storePath(renderTilesEl, currentGrid);
    console.log("pathTilesEl", pathTilesEl);
    let tilesPicked = pickHints(currentPos, currentLevel, pathTilesEl);
    function toggleStyle() {
        tilesPicked.forEach((tile) => {
            tile.tileEl.classList.toggle("tile-hint");
        });
    }
    toggleStyle();
    setTimeout(toggleStyle, 2000);
}
function changeLevel() {
    currentLevel = levels[currentLevel.index === 2 ? 0 : currentLevel.index + 1];
    btnDiffEl.innerText = `Level: ${LVL_NAMES[currentLevel.index]}`;
    newBoard();
}

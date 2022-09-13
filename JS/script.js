"use strict";
// * CLASSES
class Level {
    _index;
    _dimGrid;
    _randWeight;
    _maxValueEnemy;
    _maxValueHealth;
    _scoreMulti;
    _hints;
    /**
     * * Creates an instance of Level.
     * @param {number} _index Index of level in array, also used for determining starting HP
     * @param {number} _dimGrid Dimensions of grid to generate based on level
     * @param {number[]} _randWeight Weight that determines ratio of enemy to health tiles for randomizer
     * @param {number} _maxValueEnemy Max value for enemy tile
     * @param {number} _maxValueHealth Max value for health tile
     * @param {number} _scoreMulti Score multiplier (unimplemented)
     * @param {number} _hints Number of hints to show
     * @memberof Level Difficulty of the current round
     */
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
    /**
     * * Creates an instance of a sprite for adding to tile.
     * SVG Vectors obtained from https://www.svgrepo.com/collection/role-playing-game/
     *
     * @param {string} _type Name of vector, relates to src file and file location
     * @memberof Sprite SVG of sprite to add to board
     */
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
    /**
     * * Creates an instance of arrow SVG for adding to tile for visualizer mode.
     * SVG Vector obtained from https://www.svgrepo.com/vectors/arrow/
     *
     * @param {string} _type
     * @memberof Arrow SVG arrow to add to board
     */
    constructor(_type) {
        super(_type);
        this._type = _type;
    }
    /**
     * * Generates alternative text for instance of SVG arrow
     *
     * @param {string} dir Direction of arrow
     * @return {string} Text for alt attribute of SVG
     * @memberof Arrow
     */
    altDir(dir) {
        return `A ${dir} arrow`;
    }
}
class Tile {
    _pos;
    _content;
    _value;
    _dir;
    /**
     * * Creates an instance of a grid tile for storing content information in the model.
     * @param {Coord} _pos Position of tile in Y, X space
     * @param {Content} _content Type of content in tile: start, end, enemy, health
     * @param {number} _value Value of content in tile
     * @param {(Direction | null)} _dir Direction tile points to in traceback algorithm when computing the path
     * @memberof Tile
     */
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
// * GLOBAL CONSTANTS
const START = { y: 0, x: 0 };
const ARROW_INDEX = {
    DOWN: 0,
    RIGHT: 1,
};
// * Enemy sprites
const spider = new Sprite("spider");
const orc = new Sprite("orc");
const reaper = new Sprite("reaper");
const dragon = new Sprite("dragon");
const ENEMIES = [spider, orc, reaper, dragon];
// * Health sprites
const meat = new Sprite("meat");
const potion = new Sprite("potion");
const HEALTH = [meat, potion];
// * Knight and tresure sprites
const knight = new Sprite("knight");
const treasure = new Sprite("treasure");
const GOAL = [treasure];
// * Arrow sprites
const downArrow = new Arrow("down-arrow");
const rightArrow = new Arrow("right-arrow");
const ARROWS = [downArrow, rightArrow];
const TILE_CONTENT = ["enemy", "potion"];
// * Difficulty levels
const LVL_NAMES = ["Easy", "Med", "Hard"];
const EASY = new Level(0, 4, [0.7, 0.3], 16, 8, 0.9, 1);
const MEDIUM = new Level(1, 6, [0.775, 0.225], 20, 6, 1.1, 3);
const HARD = new Level(2, 8, [0.85, 0.15], 32, 4, 2, 3);
const levels = [EASY, MEDIUM, HARD];
// * DOM ELEMENTS SELECTED
const healthEl = document.querySelector(".js-status");
const gridParentEl = document.querySelector(".js-grid");
const btnsResetEl = document.querySelectorAll(".js-btn-reset");
const btnsNewEl = document.querySelectorAll(".js-btn-new");
const btnHintEl = document.querySelector(".js-btn-hint");
const btnDiffEl = document.querySelector(".js-btn-diff");
const btnVisualizeEl = document.querySelector(".js-btn-visualize");
const modalScreenEl = document.querySelector(".js-modal");
const modalHeaderEl = document.querySelector(".js-modal-header");
const modalMessageEl = document.querySelector(".js-modal-message");
// * GLOBAL VARIABLES
let currentPos = START;
let currentHP = 0;
let currentLevel = levels[0];
let visualizeState = false;
let resetBoardCall = false;
let enemiesRank = Math.floor(currentLevel.maxValueEnemy / ENEMIES.length);
let healthRank = Math.floor(currentLevel.maxValueHealth / HEALTH.length);
// * Create matrix and knight in model
let currentGrid = createGrid(currentLevel.dimGrid, currentLevel.dimGrid);
[currentHP, currentGrid] = calcGrid(currentGrid);
let knightEl = createKnight(knight);
// * Render grid and current HP to DOM
let renderTilesEl = renderGrid(currentGrid, gridParentEl);
let nextValidTilesEl = renderNextValid(currentPos, [], renderTilesEl);
healthEl.innerText = `HP: ${currentHP}`;
let pathTilesEl = storePath(renderTilesEl, currentGrid);
// * EVENT LISTENERS
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
btnVisualizeEl.addEventListener("click", visualizerToggle);
// * FUNCTIONS
// * Random number generators
/**
 * * Weighted random number generator.
 * Used for determining tile type based on difficulty
 *
 * @param {number[]} weight Array of representing the weighted ratio of outcomes
 * @return {number} Returns the selected choice as an index of the random outcome
 */
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
/**
 * * Random number generator within a specific range.
 * ! Max is not included
 *
 * @param {number} min Minimum number inside the range
 * @param {number} max Maximum number outside of the range
 * @return {number} Random number within specified range
 */
function randRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
/**
 * * Timer for waiting certain time in milliseconds
 *
 * ! Requires browser support for ES7 (async-await)
 *
 * Uses async await syntax based on source:
 * https://stackoverflow.com/questions/3583724/how-do-i-add-a-delay-in-a-javascript-loop
 *
 * @param {number} ms Time in milliseconds to return resolved promise
 * @return {Promise} Resolved promise after certain time for use in async-await functions
 */
function wait(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
// * Create objects on model
/**
 * * Generates grid of specified dimensions with random content in each tile
 * Dimensions and content type and value are based on current difficulty
 *
 * ! Needs currentLevel in global scope
 *
 * @param {number} row Number of rows of grid
 * @param {number} col Number of columns of grid
 * @return {Tile[][]} gameMatrix 2D Array of Tile instances representing the grid in model
 */
function createGrid(row, col) {
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
                const maxValues = [currentLevel.maxValueEnemy, currentLevel.maxValueHealth];
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
    console.log(gameMatrix);
    return gameMatrix;
}
/**
 * * Calculates the generated grid for starting HP and updates direction for each Tile
 * Uses dynamic programming and traceback algorithm approach for linear time complexity
 * Modifies each tile to point to a next tile, allowing solution path to be generated
 * by traversing a linked-list like data structure from the start tile
 *
 *
 * @param {Tile[][]} grid Generated grid to process
 * @return {[number, Tile[][]]} [Starting HP, grid] Returns starting HP for grid, and modifies input grid with directions
 */
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
/**
 * * Creates knight container with SVG sprite of knight and current HP
 *
 * ! Requires knight Sprite instance and currentHP
 *
 * @param {Sprite} sprite SVG of knight to use
 * @return {HTMLDivElement}  Knight container as an HTMLDivElement
 */
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
// * Render objects for view
/**
 * * Render sprite to grid tile container based on instructions
 *
 * @param {HTMLImageElement} imgElement HTMLImageElement that will be the img container for the sprite
 * @param {(Sprite[] | Arrow[])} sprites Array of sprite instances to select from, usually enemy or health type
 * @param {number} index Index of Sprite instance in particular array
 * @param {number} [value] Optional value of tile
 * @return {HTMLImageElement}  Returns the input imgElement with the correct SVG element
 */
function renderSprite(imgElement, sprites, index, value) {
    if (index > sprites.length) {
        console.log(`Failed to find ${index}`);
    }
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
/**
 * * Render input Tile instance to view with appropriate sprite
 *
 * @param {Tile} tile input Tile instance for rendering
 * @return {HTMLElement}  Returns HTMLElement that is the container for DOM representation of a grid square
 */
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
    container.classList.add("js-visualize-off");
    return container;
}
/**
 * * Render grid to view
 *
 * @param {Tile[][]} matrix Generated grid in model
 * @param {HTMLDivElement} gridParentEl Parent container of grid in DOM from query selector
 * @return {HTMLElement[][]} renderTilesEl 2D Array of HTMLElements that represent the rendered grid
 */
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
/**
 * * Render knight position to match player move and updates rendered knight HP
 * ! Requires knightEl in global scope
 *
 * @param {string} direction Direction of player move represented as a string
 * @param {HTMLElement} target Target HTML Element that the player clicks on for the knight to move to
 */
function renderKnightMove(direction, target) {
    knightEl.classList.add(`knight-${direction}`);
    const updateKnight = function () {
        knightEl.classList.remove(`knight-${direction}`);
        target.appendChild(knightEl);
    };
    setTimeout(updateKnight, 500);
    const knightHP = knightEl.lastElementChild;
    knightHP.innerText = currentHP.toString();
}
/**
 * * Render shake animation for knight if player move is invalid
 *
 * @param {(Element | null)} knightEl Knight element
 */
function renderShake(knightEl) {
    function removeShake() {
        if (knightEl?.classList.contains("js-shake")) {
            knightEl.classList.remove("js-shake");
        }
    }
    removeShake();
    knightEl?.classList.add("js-shake");
    setTimeout(removeShake, 500);
}
/**
 * * Render idle floating animation for next valid tiles
 *
 * @param {Coord} curPos Current position of knight as a Coord instance
 * @param {HTMLElement[]} curValid Current valid tiles as an array of HTMLElements of their container
 * @param {HTMLElement[][]} renderTilesEl 2D Array of HTMLElements that represent the rendered view of the model grid
 * @return {HTMLElement[]} curValid Modifies the curValid array in place to have the updated next valid tiles
 */
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
/**
 * * Render victory screen as modal if the player reaches a valid victory board state
 * ! Requires modalHeaderEl, modalMessageEl, modalScreenEl from query selector
 */
function renderVictory() {
    modalHeaderEl.innerText = "Congratulations!";
    modalMessageEl.innerText = `You reached the goal with ${currentHP} HP remaining!`;
    if (!modalScreenEl.open) {
        modalScreenEl.showModal();
    }
}
/**
 * * Render defeat screen as modal if the player's HP reaches 0
 * ! Requires modalHeaderEl, modalMessageEl, modalScreenEl from query selector
 */
function renderDefeat() {
    modalHeaderEl.innerText = "Game Over!";
    modalMessageEl.innerText = `You have 0 HP remaining!`;
    if (!modalScreenEl.open) {
        modalScreenEl.showModal();
    }
}
/**
 * * Computes solution path and returns path as an array.
 *
 * @param {HTMLElement[][]} renderTilesEl 2D Array of HTMLElements that represent the rendered view of the model grid
 * @param {Tile[][]} path 2D Array of Tile instances that represent current grid in Model
 * @return {PathTile[]}  pathTilesEl Solution path as array of PathTile objects with position and rendered HTMLElement container
 */
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
/**
 * * Randomly picks hint tiles to display based on difficulty
 * Will not pick hints from solution path that the player has already traversed past
 *
 * @param {Coord} curPos Current position as Coord object
 * @param {Level} curLevel Current difficulty level as Level object
 * @param {PathTile[]} pathTilesEl Array of PathTile elements representing the solution path
 * @return {PathTile[]} Array of selected PathTile elements to display as hints
 */
function pickHints(curPos, curLevel, pathTilesEl) {
    const validTiles = pathTilesEl.filter((pathTile) => {
        if (pathTile.pos.x >= curPos.x && pathTile.pos.y >= curPos.y) {
            if (pathTile.pos.x === curPos.x && pathTile.pos.y === curPos.y) {
                return false;
            }
            return true;
        }
    });
    const tilesShown = [];
    if (curLevel.hints >= validTiles.length) {
        return validTiles;
    }
    else {
        while (tilesShown.length < curLevel.hints) {
            const index = randRange(0, validTiles.length);
            tilesShown.push(validTiles.splice(index, 1)[0]);
        }
    }
    return tilesShown;
}
/**
 * * If visualization mode is on, render arrows that denote direction from traceback algorithm, then highlights solution path
 * Uses timer of 100ms to represent iteration of traceback algorithm
 * Returns promise early if there is a resetBoard() call or visualization mode is off.
 *
 * ! Requires visualizeState and resetBoardCall boolean in global scope
 * ! Requires browser support for ES7 (async-await)
 *
 * Uses async await syntax based on source:
 * https://stackoverflow.com/questions/3583724/how-do-i-add-a-delay-in-a-javascript-loop
 *
 * @param {HTMLElement[][]} renderTilesEl 2D Array of HTMLElements that represent the rendered view of the model grid
 * @param {PathTile[]} pathTilesEl Solution path as array of PathTile objects with position and rendered HTMLElement container
 * @return {Promise} Resolve promise if finished rendering all tiles and solution path or resolves early if board state changes
 */
async function renderTileArrowsEl(renderTilesEl, pathTilesEl) {
    for (let row = renderTilesEl.length - 1; row >= 0; row--) {
        for (let col = renderTilesEl[0].length - 1; col >= 0; col--) {
            if (!visualizeState || resetBoardCall) {
                return Promise.resolve();
            }
            renderTilesEl[row][col].classList.remove("js-visualize-off");
            await wait(100);
        }
        if (!visualizeState || resetBoardCall) {
            return Promise.resolve();
        }
    }
    for (let i = 0; i < pathTilesEl.length; i++) {
        if (!visualizeState || resetBoardCall) {
            return Promise.resolve();
        }
        pathTilesEl[i].tileEl.classList.add("js-show-path");
        console.log(`Showing path tile ${i}`);
        await wait(100);
    }
}
/**
 * * Hides all rendered arrows on DOM if visualization mode is turned off
 *
 * @param {HTMLElement[][]} renderTilesEl 2D Array of HTMLElements that represent the rendered view of the model grid
 * @param {PathTile[]} pathTilesEl Solution path as array of PathTile objects with position and rendered HTMLElement container
 */
function hideTileArrowsEl(renderTilesEl, pathTilesEl) {
    for (let row = renderTilesEl.length - 1; row >= 0; row--) {
        for (let col = renderTilesEl[0].length - 1; col >= 0; col--) {
            renderTilesEl[row][col].classList.add("js-visualize-off");
        }
    }
    for (let i = 0; i < pathTilesEl.length; i++) {
        pathTilesEl[i].tileEl.classList.remove("js-show-path");
    }
}
/**
 * * Determines if move is valid (if target is adjacent right or down tile)
 *
 * @param {Coord} curPos Current position of knight as Coord object
 * @param {Coord} movePos Target position of knight as Coord object based on player input
 * @return {string | boolean}  Direction of valid move "right" or "down" or false as boolean if move is not valid
 */
function moveIsValid(curPos, movePos) {
    if (movePos.x - curPos.x === 1 && movePos.y === curPos.y) {
        return "right";
    }
    else if (movePos.x === curPos.x && movePos.y - curPos.y === 1) {
        return "down";
    }
    return false;
}
/**
 * * Calculates new HP based on move
 *
 * @param {number} curHP Current HP
 * @param {Coord} curPos Current position as Coord object
 * @param {Coord} movePos Final target position as Coord object
 * @param {Tile[][]} matrixGrid 2D Array of Tile instances that represent current grid in Model
 * @return {number} newHP New HP after move
 */
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
// * Callback functions for listeners
/**
 * * Callback function for click on a tile
 * Uses event propogation for one event listener on the container for game grid
 * Clicking on SVG or background of grid or text value are all valid inputs, except for clicking on the knight itself
 * If tile is valid, processes the move and determines if the round continues, round ends in defeat, or round ends in victory
 * Else, knight will shake to indicate the move is invalid
 *
 * ! Requires currentPos, targetPos, currentHP, currentGrid
 * ! Requires knightEl, healthEl, nextValidTilesEl, renderTilesEl
 *
 * @param {Event} event
 */
function onTileClick(event) {
    let target = event.target;
    // Selects parent container if mouse target is SVG or text-value of tile but not if the target were the knight itself
    if ((target.tagName === "IMG" || target.tagName === "P") &&
        !target.parentElement?.classList.contains("container-knight")) {
        target = target.parentElement;
    }
    // If selected or updated target is a valid grid tile, determine if the move is valid, if the game continues or ends in defeat/victory
    if (target && target.dataset.X) {
        const targetPos = { y: parseInt(target.dataset.Y), x: parseInt(target.dataset.X) };
        const direction = moveIsValid(currentPos, targetPos);
        if (direction) {
            const newHP = processHP(currentHP, currentPos, targetPos, currentGrid);
            currentPos = targetPos;
            currentHP = newHP;
            renderKnightMove(direction, target);
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
/**
 * * Reset the board state with the same generated grid, updating all global variables
 * Removes all elements from DOM and recreates them to show default state of generated grid
 * Also the callback function for Reset Board button
 *
 * Uses async await to trigger resetBoardCall to be true for enough time to resolve renderTileArrowsEl function early
 * This is to avoid extraneous functions on the call stack when visualization mode is on and the board is reset or updated
 * before the current board visualization is finished
 *
 * ! Requires currentPos, currentHP, currentGrid, knight Sprite
 * ! Requires modalScreenEl, gridParentEl, healthEl from query selector
 * ! Requires and updates knightEl, renderTilesEl, nextValidTilesEl, pathTilesEl
 * ! Requires browser support for ES7 (async-await)
 *
 */
async function resetBoard() {
    resetBoardCall = true;
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
    pathTilesEl = storePath(renderTilesEl, currentGrid);
    // Render HP on DOM
    healthEl.innerText = `HP: ${currentHP}`;
    await wait(250);
    resetBoardCall = false;
    if (visualizeState && !resetBoardCall) {
        renderTileArrowsEl(renderTilesEl, pathTilesEl);
    }
}
/**
 * * Generates a new random grid and board based on difficulty
 * Also callback function for New Board button
 *
 * ! Requires currentGrid and currentLevel
 *
 */
function newBoard() {
    currentGrid = createGrid(currentLevel.dimGrid, currentLevel.dimGrid);
    resetBoard();
}
/**
 * * Renders randomly selected tiles to view as hints of the solution path
 * Callback function for Show Hint button
 *
 * ! Requires currentGrid, pathTilesEl, renderTilesEl
 */
function renderHint() {
    pathTilesEl = storePath(renderTilesEl, currentGrid);
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
/**
 * * Changes difficulty level and generates new board to match new level
 * Callback function for Difficulty button
 *
 * ! Requires btnDiffEl from query selector
 * ! Requires and updates currentLevel, enemiesRank, healthRank
 */
function changeLevel() {
    currentLevel = levels[currentLevel.index === 2 ? 0 : currentLevel.index + 1];
    enemiesRank = Math.floor(currentLevel.maxValueEnemy / ENEMIES.length);
    healthRank = Math.floor(currentLevel.maxValueHealth / HEALTH.length);
    btnDiffEl.innerText = `Level: ${LVL_NAMES[currentLevel.index]}`;
    newBoard();
}
/**
 * * Toggles visualizer mode to show traceback algorithm and computed solution path
 * Callback function for Visualizer button
 * Renders arrows or hides them depending on new state
 *
 * ! Requires btnVisualizeEl from query selector
 * ! Requires visualizeState, resetBoardCall, renderTilesEl, pathTilesEl
 */
function visualizerToggle() {
    visualizeState = !visualizeState;
    btnVisualizeEl.classList.toggle("js-button-on");
    btnVisualizeEl.innerText = visualizeState ? "Visualizer: On" : "Visualizer: Off";
    if (visualizeState && !resetBoardCall) {
        renderTileArrowsEl(renderTilesEl, pathTilesEl);
    }
    else {
        hideTileArrowsEl(renderTilesEl, pathTilesEl);
    }
}

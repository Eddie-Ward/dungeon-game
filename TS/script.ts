interface Coord {
	y: number;
	x: number;
}

interface PathTile {
	pos: Coord;
	tileEl: HTMLElement;
}

type Content = "potion" | "enemy" | "start" | "finish";
type Direction = "right" | "down" | "end";

// * CLASSES

class Level {
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
	constructor(
		protected _index: number,
		protected _dimGrid: number,
		protected _randWeight: number[],
		protected _maxValueEnemy: number,
		protected _maxValueHealth: number,
		protected _scoreMulti: number,
		protected _hints: number
	) {}
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
	/**
	 * * Creates an instance of a sprite for adding to tile.
	 * SVG Vectors obtained from https://www.svgrepo.com/collection/role-playing-game/
	 *
	 * @param {string} _type Name of vector, relates to src file and file location
	 * @memberof Sprite SVG of sprite to add to board
	 */
	constructor(protected _type: string) {}

	get type() {
		return this._type;
	}
	src(): string {
		return `./SRC/SVG/${this.type}-svgrepo-com.svg`;
	}
	style(): string {
		return `svg-${this.type}`;
	}
	alt(value: number): string {
		return `${this.type} with ${value} HP`;
	}
}

class Arrow extends Sprite {
	/**
	 * * Creates an instance of arrow SVG for adding to tile for visualizer mode.
	 * SVG Vector obtained from https://www.svgrepo.com/vectors/arrow/
	 *
	 * @param {string} _type
	 * @memberof Arrow SVG arrow to add to board
	 */
	constructor(protected _type: string) {
		super(_type);
	}
	/**
	 * * Generates alternative text for instance of SVG arrow
	 *
	 * @param {string} dir Direction of arrow
	 * @return {string} Text for alt attribute of SVG
	 * @memberof Arrow
	 */
	altDir(dir: string): string {
		return `A ${dir} arrow`;
	}
}

class Tile {
	/**
	 * * Creates an instance of a grid tile for storing content information in the model.
	 * @param {Coord} _pos Position of tile in Y, X space
	 * @param {Content} _content Type of content in tile: start, end, enemy, health
	 * @param {number} _value Value of content in tile
	 * @param {(Direction | null)} _dir Direction tile points to in traceback algorithm when computing the path
	 * @memberof Tile
	 */
	constructor(
		protected _pos: Coord,
		protected _content: Content,
		protected _value: number,
		protected _dir: Direction | null
	) {}
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
	set dir(value: Direction | null) {
		this._dir = value;
	}
}

// * GLOBAL CONSTANTS

const START: Coord = { y: 0, x: 0 };
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

const TILE_CONTENT: Content[] = ["enemy", "potion"];

// * Difficulty levels

const LVL_NAMES = ["Easy", "Med", "Hard"];
const EASY = new Level(0, 4, [0.7, 0.3], 16, 8, 0.9, 1);
const MEDIUM = new Level(1, 6, [0.775, 0.225], 20, 6, 1.1, 3);
const HARD = new Level(2, 8, [0.85, 0.15], 32, 4, 2, 3);

const levels = [EASY, MEDIUM, HARD];

// * DOM ELEMENTS SELECTED

const healthEl = document.querySelector(".js-status") as HTMLDivElement;
const gridParentEl = document.querySelector(".js-grid") as HTMLDivElement;
const btnsResetEl = document.querySelectorAll(".js-btn-reset") as NodeListOf<HTMLButtonElement>;
const btnsNewEl = document.querySelectorAll(".js-btn-new") as NodeListOf<HTMLButtonElement>;
const btnHintEl = document.querySelector(".js-btn-hint") as HTMLButtonElement;
const btnDiffEl = document.querySelector(".js-btn-diff") as HTMLButtonElement;
const btnVisualizeEl = document.querySelector(".js-btn-visualize") as HTMLButtonElement;
const modalScreenEl = document.querySelector(".js-modal") as HTMLDialogElement;
const modalHeaderEl = document.querySelector(".js-modal-header") as HTMLHeadingElement;
const modalMessageEl = document.querySelector(".js-modal-message") as HTMLParagraphElement;

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
function randWeight(weight: number[]): number {
	let random = Math.random();
	for (let i = 0; i < weight.length; i++) {
		if (random < weight[i]) {
			return i;
		} else {
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
function randRange(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min) + min);
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
function createGrid(row: number, col: number): Tile[][] {
	const gameMatrix: Tile[][] = [];
	for (let i = 0; i < row; i++) {
		const gameRow: Tile[] = [];
		for (let j = 0; j < col; j++) {
			let tile;
			if (i === START.y && j === START.x) {
				tile = new Tile(START, "start", 0, null);
			} else if (i === row - 1 && j === col - 1) {
				tile = new Tile({ y: i, x: j }, "finish", 0, null);
			} else {
				const index = randWeight(currentLevel.randWeight);
				const maxValues = [currentLevel.maxValueEnemy, currentLevel.maxValueHealth];
				tile = new Tile({ y: i, x: j }, TILE_CONTENT[index], randRange(1, maxValues[index]), null);
			}
			if (tile) {
				gameRow.push(tile);
			} else {
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
function calcGrid(grid: Tile[][]): [number, Tile[][]] {
	const n = grid[0].length;
	const m = grid.length;

	const row: number[] = new Array(n + 1);
	const dp: number[][] = new Array(m + 1);
	dp.fill(row.fill(Infinity));

	for (let row = m - 1; row >= 0; row--) {
		const pathsRow: Direction[] = [];
		for (let col = n - 1; col >= 0; col--) {
			if (row === m - 1 && col === n - 1) {
				dp[row][col] = 0;
			} else {
				const value = grid[row][col].content === "enemy" ? grid[row][col].value : grid[row][col].value * -1;
				const down = dp[row + 1][col];
				const right = dp[row][col + 1];
				if (down < right) {
					grid[row][col].dir = "down";
					dp[row][col] = Math.max(value, value + down);
				} else {
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
function createKnight(sprite: Sprite): HTMLDivElement {
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
function renderSprite(
	imgElement: HTMLImageElement,
	sprites: Sprite[] | Arrow[],
	index: number,
	value?: number
): HTMLImageElement {
	if (index > sprites.length) {
		console.log(`Failed to find ${index}`);
	}
	imgElement.src = sprites[index].src();
	if (value) {
		imgElement.alt = sprites[index].alt(value);
	} else {
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
function renderTile(tile: Tile): HTMLElement {
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
	} else if (tile.content === "potion") {
		svgSprite = renderSprite(svgSprite, HEALTH, Math.floor(tile.value / healthRank), tile.value);

		valueText.innerText = `+${tile.value}`;
		valueText.classList.add("text-value-health");

		container.classList.add("tile-health");
	} else if (tile.content === "start") {
		//Add start text to the tile if it is the start tile
		valueText.innerText = `Start`;
		valueText.classList.add("text-value-start");
		container.classList.add("tile-start");
		container.classList.add("tile-selected");
	} else if (tile.content === "finish") {
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
		} else {
			svgArrow = renderSprite(svgArrow, ARROWS, ARROW_INDEX.DOWN);
			svgArrow.alt = rightArrow.altDir("down");
		}
		container.appendChild(svgArrow);
	}

	if (tile.content === "start") {
		//Add knight to the tile if it is the start tile
		container.appendChild(knightEl);
	} else {
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
function renderGrid(matrix: Tile[][], gridParentEl: HTMLDivElement): HTMLElement[][] {
	const renderTilesEl: HTMLElement[][] = [];
	gridParentEl.style.gridTemplateColumns = `repeat(${matrix[0].length}, 1fr)`;
	gridParentEl.style.gridTemplateRows = `repeat(${matrix.length}, 1fr)`;
	for (let i = 0; i < matrix.length; i++) {
		const renderRowEl: HTMLElement[] = [];
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
function renderKnightMove(direction: string, target: HTMLElement) {
	knightEl.classList.add(`knight-${direction}`);
	const updateKnight = function () {
		knightEl.classList.remove(`knight-${direction}`);
		target.appendChild(knightEl);
	};
	setTimeout(updateKnight, 500);
	const knightHP = knightEl.lastElementChild as HTMLElement;
	knightHP.innerText = currentHP.toString();
}

/**
 * * Render shake animation for knight if player move is invalid
 *
 * @param {(Element | null)} knightEl Knight element
 */
function renderShake(knightEl: Element | null) {
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
function renderNextValid(curPos: Coord, curValid: HTMLElement[], renderTilesEl: HTMLElement[][]): HTMLElement[] {
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
	} else if (curPos.x === n - 1) {
		// console.log(`Currently at max ${curPos.x}`);
		curValid = [renderTilesEl[curPos.y + 1][curPos.x]];
	} else {
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
function storePath(renderTilesEl: HTMLElement[][], path: Tile[][]): PathTile[] {
	const pathTilesEl: PathTile[] = [];
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
async function renderTileArrowsEl(renderTilesEl: HTMLElement[][], pathTilesEl: PathTile[]) {
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
function hideTileArrowsEl(renderTilesEl: HTMLElement[][], pathTilesEl: PathTile[]) {
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
function moveIsValid(curPos: Coord, movePos: Coord): string | boolean {
	if (movePos.x - curPos.x === 1 && movePos.y === curPos.y) {
		return "right";
	} else if (movePos.x === curPos.x && movePos.y - curPos.y === 1) {
		return "down";
	}
	return false;
}

function processHP(curHP: number, curPos: Coord, movePos: Coord, matrixGrid: Tile[][]): number {
	let newHP = curHP;
	if (matrixGrid[movePos.y][movePos.x].content === "enemy") {
		newHP -= matrixGrid[movePos.y][movePos.x].value;
		if (newHP <= 0) {
			return 0;
		}
	} else if (matrixGrid[movePos.y][movePos.x].content === "potion") {
		newHP += matrixGrid[movePos.y][movePos.x].value;
	}
	return newHP;
}

// Callback functions for listeners

function onTileClick(event: Event) {
	let target = event.target as HTMLElement;
	if (
		(target.tagName === "IMG" || target.tagName === "P") &&
		!target.parentElement?.classList.contains("container-knight")
	) {
		target = target.parentElement as HTMLElement;
	}
	if (target && target.dataset.X) {
		const targetPos: Coord = { y: parseInt(target.dataset.Y as string), x: parseInt(target.dataset.X as string) };
		const direction = moveIsValid(currentPos, targetPos);
		if (direction) {
			const newHP = processHP(currentHP, currentPos, targetPos, currentGrid);
			currentPos = targetPos;
			currentHP = newHP;

			renderKnightMove(direction as string, target);
			healthEl.innerText = `HP: ${currentHP}`;
			target.classList.add("tile-selected");

			if (currentHP > 0) {
				nextValidTilesEl = renderNextValid(currentPos, nextValidTilesEl, renderTilesEl);
				if (target.classList.contains("tile-finish")) {
					renderVictory();
				}
			} else {
				renderDefeat();
			}
		} else {
			renderShake(knightEl);
		}
	}
}

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

function newBoard() {
	currentGrid = createGrid(currentLevel.dimGrid, currentLevel.dimGrid);
	resetBoard();
}

function pickHints(curPos: Coord, curLevel: Level, pathTilesEl: PathTile[]): PathTile[] {
	const validTiles = pathTilesEl.filter((pathTile) => {
		if (pathTile.pos.x >= curPos.x && pathTile.pos.y >= curPos.y) {
			if (pathTile.pos.x === curPos.x && pathTile.pos.y === curPos.y) {
				return false;
			}
			return true;
		}
	});
	const tilesShown: PathTile[] = [];
	if (curLevel.hints >= validTiles.length) {
		return validTiles;
	} else {
		while (tilesShown.length < curLevel.hints) {
			const index = randRange(0, validTiles.length);
			tilesShown.push(validTiles.splice(index, 1)[0]);
		}
	}
	return tilesShown;
}

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

function changeLevel() {
	currentLevel = levels[currentLevel.index === 2 ? 0 : currentLevel.index + 1];
	enemiesRank = Math.floor(currentLevel.maxValueEnemy / ENEMIES.length);
	healthRank = Math.floor(currentLevel.maxValueHealth / HEALTH.length);
	btnDiffEl.innerText = `Level: ${LVL_NAMES[currentLevel.index]}`;
	newBoard();
}

function visualizerToggle() {
	visualizeState = !visualizeState;
	btnVisualizeEl.classList.toggle("js-button-on");
	btnVisualizeEl.innerText = visualizeState ? "Visualizer: On" : "Visualizer: Off";

	if (visualizeState && !resetBoardCall) {
		renderTileArrowsEl(renderTilesEl, pathTilesEl);
	} else {
		hideTileArrowsEl(renderTilesEl, pathTilesEl);
	}
}

function wait(ms: number) {
	return new Promise((res) => setTimeout(res, ms));
}

interface Coord {
	y: number;
	x: number;
}

type Content = "potion" | "enemy" | "start" | "finish";
type Direction = "right" | "down" | "end";

class Level {
	constructor(
		protected _index: number,
		protected _dimGrid: number,
		protected _randWeight: number[],
		protected _maxValueEnemy: number,
		protected _maxValueHealth: number,
		protected _scoreMulti: number
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
}

class Sprite {
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

class Tile {
	constructor(protected _pos: Coord, protected _content: Content, protected _value: number) {}
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

const START: Coord = { y: 0, x: 0 };
const STATUSES = {
	HP: 0,
	SCORE: 1,
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

const TILE_CONTENT: Content[] = ["enemy", "potion"];
const LVL_NAMES = ["Easy", "Medium", "Hard"];

const EASY = new Level(0, 4, [0.7, 0.3], 16, 8, 0.9);
const MEDIUM = new Level(1, 6, [0.775, 0.225], 20, 6, 1.1);
const HARD = new Level(2, 8, [0.85, 0.15], 32, 4, 2);

const levels = [EASY, MEDIUM, HARD];

// Query select DOM elements
const statusesEl = document.querySelectorAll(".js-status") as NodeListOf<HTMLDivElement>;
const gridEl = document.querySelector(".js-grid") as HTMLDivElement;
const btnsResetEl = document.querySelectorAll(".js-btn-reset") as NodeListOf<HTMLButtonElement>;
const btnsNewEl = document.querySelectorAll(".js-btn-new") as NodeListOf<HTMLButtonElement>;
const btnHintEl = document.querySelector(".js-btn-hint") as HTMLButtonElement;
const btnDiffEl = document.querySelector(".js-btn-diff") as HTMLButtonElement;
const victoryScreenEl = document.querySelector(".js-victory") as HTMLDivElement;
const victoryMessageEl = document.querySelector(".js-victory-message") as HTMLParagraphElement;

// Initialize global variables
let currentPos = START;
let currentLevel = levels[0];

let curMaxEnemy = currentLevel.maxValueEnemy;
let curMaxHealth = currentLevel.maxValueHealth;

let enemiesRank = Math.floor(curMaxEnemy / ENEMIES.length);
let healthRank = Math.floor(curMaxHealth / HEALTH.length);

// Create matrix and knight in model
let currentGrid = createGrid(currentLevel.dimGrid, currentLevel.dimGrid);
let [currentHP, mapPaths] = calcGrid(currentGrid);
let knightEl = createKnight(knight);
// currentGrid.forEach((row) => {
// 	row.forEach((tile) => {
// 		console.log(`${tile.content} at [${tile.pos.x}, ${tile.pos.y}] with ${tile.value}`);
// 	});
// });

// Render grid and current HP to DOM
let renderGridEl = renderGrid(currentGrid, gridEl);
statusesEl[STATUSES.HP].innerText = `HP: ${currentHP}`;

renderPath(renderGridEl, mapPaths);

// Add event listeners
gridEl.addEventListener("click", onTileClick);
for (const btn of btnsResetEl) {
	btn.addEventListener("click", resetBoard);
}
for (const btn of btnsNewEl) {
	btn.addEventListener("click", newBoard);
}
btnDiffEl.addEventListener("mouseover", () => {
	btnDiffEl.innerText = `Try ${LVL_NAMES[currentLevel.index === 2 ? 0 : currentLevel.index + 1]}`;
});
btnDiffEl.addEventListener("mouseout", () => {
	btnDiffEl.innerText = `Level: ${LVL_NAMES[currentLevel.index]}`;
});
btnDiffEl.addEventListener("click", changeLevel);

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

function randRange(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min) + min);
}

function createGrid(row: number, col: number): Tile[][] {
	console.log(`Generating ${row} by ${col} grid`);
	const gameMatrix: Tile[][] = [];
	for (let i = 0; i < row; i++) {
		const gameRow: Tile[] = [];
		for (let j = 0; j < col; j++) {
			let tile;
			if (i === START.y && j === START.x) {
				tile = new Tile(START, "start", 0);
			} else if (i === row - 1 && j === col - 1) {
				tile = new Tile({ y: i, x: j }, "finish", 0);
			} else {
				const index = randWeight(currentLevel.randWeight);
				const maxValues = [curMaxEnemy, curMaxHealth];
				tile = new Tile({ y: i, x: j }, TILE_CONTENT[index], randRange(1, maxValues[index]));
			}
			if (tile) {
				gameRow.push(tile);
			} else {
				console.log("Failed to generate tile");
			}
		}
		gameMatrix.push(gameRow);
	}
	return gameMatrix;
}

function calcGrid(grid: Tile[][]): [number, Direction[][]] {
	const n = grid[0].length;
	const m = grid.length;
	const paths: Direction[][] = [[]];
	const row: number[] = new Array(n + 1);
	const dp: number[][] = new Array(m + 1);
	dp.fill(row.fill(Infinity));
	for (let row = m - 1; row >= 0; row--) {
		const pathsRow: Direction[] = [];
		for (let col = n - 1; col >= 0; col--) {
			if (row === m - 1 && col === n - 1) {
				dp[row][col] = 0;
				pathsRow.unshift("end");
			} else {
				const value = grid[row][col].content === "enemy" ? grid[row][col].value : grid[row][col].value * -1;
				const down = dp[row + 1][col];
				const right = dp[row][col + 1];
				if (down < right) {
					pathsRow.unshift("down");
					dp[row][col] = Math.max(value, value + down);
				} else {
					pathsRow.unshift("right");
					dp[row][col] = Math.max(value, value + right);
				}
				// console.log(`[${x + 1}][${y + 1}] is ${dp[y][x]}`);
			}
		}
		paths.unshift(pathsRow);
	}
	return [dp[0][0] + 3 - currentLevel.index, paths];
}

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

function renderSprite(
	imgElement: HTMLImageElement,
	sprites: Sprite[],
	index: number,
	value?: number
): HTMLImageElement {
	imgElement.src = sprites[index].src();
	if (value) {
		imgElement.alt = sprites[index].alt(value);
	} else {
		imgElement.alt = sprites[index].toString();
	}
	imgElement.classList.add(sprites[index].style());
	return imgElement;
}

function renderTile(tile: Tile): HTMLElement {
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
	if (tile.content === "start") {
		//Add knight to the tile if it is the start tile
		container.appendChild(knightEl);
	} else {
		container.appendChild(svgSprite);
	}
	container.appendChild(valueText);
	return container;
}

function renderGrid(matrix: Tile[][], gridEl: HTMLDivElement): HTMLElement[][] {
	const renderGridEl: HTMLElement[][] = [];
	gridEl.style.gridTemplateColumns = `repeat(${matrix[0].length}, 1fr)`;
	gridEl.style.gridTemplateRows = `repeat(${matrix.length}, 1fr)`;
	for (let i = 0; i < matrix.length; i++) {
		const renderRowEl: HTMLElement[] = [];
		for (let j = 0; j < matrix[0].length; j++) {
			const tile = matrix[i][j];
			const displayTile = renderTile(tile);
			displayTile.style.gridColumnStart = (j + 1).toString();
			displayTile.style.gridRowStart = (i + 1).toString();
			gridEl.appendChild(displayTile);
			renderRowEl.push(displayTile);
		}
		renderGridEl.push(renderRowEl);
	}
	return renderGridEl;
}

function renderKnight(direction: string, target: HTMLElement) {
	knightEl.classList.add(`knight-${direction}`);
	const updateKnight = function () {
		knightEl.classList.remove(`knight-${direction}`);
		target.appendChild(knightEl);
	};
	setTimeout(updateKnight, 500);
	const knightHP = knightEl.lastElementChild as HTMLElement;
	knightHP.innerText = currentHP.toString();
}

function renderVictory() {
	console.log("Victory!");
	victoryMessageEl.innerText = `You reached the goal with ${currentHP} HP remaining!`;
	if (victoryScreenEl.classList.contains("js-off")) {
		victoryScreenEl.classList.remove("js-off");
	}
}

function renderDefeat() {
	console.log("Defeat");
}

function renderPath(gridEl: HTMLElement[][], path: Direction[][]) {
	let [i, j] = [0, 0];
	let curNode = path[i][j];
	while (curNode !== "end") {
		console.log(`[${i + 1}, ${j + 1}]`);
		[i, j] = curNode === "down" ? [i + 1, j] : [i, j + 1];
		curNode = path[i][j];
	}
}

function moveIsValid(curPos: Coord, movePos: Coord): string | boolean {
	if (movePos.x - curPos.x === 1 && movePos.y === curPos.y) {
		return "right";
	} else if (movePos.x === curPos.x && movePos.y - curPos.y === 1) {
		return "down";
	}
	return false;
}

function processHP(curHP: number, curPos: Coord, movePos: Coord, matrixGrid: Tile[][]): number | boolean {
	let newHP = curHP;
	if (matrixGrid[movePos.y][movePos.x].content === "enemy") {
		newHP -= matrixGrid[movePos.y][movePos.x].value;
		if (newHP <= 0) {
			return false;
		}
	} else if (matrixGrid[movePos.y][movePos.x].content === "potion") {
		newHP += matrixGrid[movePos.y][movePos.x].value;
	}
	return newHP;
}

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
			if (newHP) {
				currentPos = targetPos;
				currentHP = newHP as number;

				renderKnight(direction as string, target);

				statusesEl[STATUSES.HP].innerText = `HP: ${currentHP}`;

				target.classList.add("tile-selected");

				if (target.classList.contains("tile-finish")) {
					renderVictory();
				}
			} else {
				alert("HP too low to move there!");
			}
		} else {
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
	[currentHP, mapPaths] = calcGrid(currentGrid);

	// Deleting the existing grid on the DOM
	while (gridEl.firstChild) {
		gridEl.removeChild(gridEl.firstChild);
	}

	// Recreate knight element, but not assigned to any children yet.
	knightEl = createKnight(knight);

	// Render new grid on DOM, with knight element
	renderGridEl = renderGrid(currentGrid, gridEl);

	// Render HP on DOM
	statusesEl[STATUSES.HP].innerText = `HP: ${currentHP}`;
}

function newBoard() {
	currentGrid = createGrid(currentLevel.dimGrid, currentLevel.dimGrid);
	resetBoard();
}

function showHint() {}

function changeLevel() {
	currentLevel = levels[currentLevel.index === 2 ? 0 : currentLevel.index + 1];
	newBoard();
}

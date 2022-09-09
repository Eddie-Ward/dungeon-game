type Coord = {
	y: number;
	x: number;
};

type Content = "potion" | "enemy" | "start" | "finish";

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
	TIME: 0,
	HP: 1,
	SCORE: 2,
};
const HIGHEST_VALUE = 16;

const spider = new Sprite("spider");
const orc = new Sprite("orc");
const reaper = new Sprite("reaper");
const dragon = new Sprite("dragon");
const ENEMIES = [spider, orc, reaper, dragon];
const ENEMIES_RANK = Math.floor(HIGHEST_VALUE / ENEMIES.length);

const meat = new Sprite("meat");
const potion = new Sprite("potion");
const HEALTH = [meat, potion];
const HEALTH_RANK = Math.floor(HIGHEST_VALUE / HEALTH.length);

const knight = new Sprite("knight");
const treasure = new Sprite("treasure");
const GOAL = [treasure];

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

//Query select DOM elements
const statusesEl = document.querySelectorAll(".js-status") as NodeListOf<HTMLDivElement>;
const gridEl = document.querySelector(".js-grid") as HTMLDivElement;
const btnHintEl = document.querySelector(".js-btn-hint");
const btnResetEl = document.querySelector(".js-btn-reset");
const btnDifficultyEl = document.querySelector(".js-btn-diff");
const btnDevModeEl = document.querySelector(".js-btn-dev");

//Initialize global variables
let currentHP = inputStartingHP;
let currentPos = START;
let matrixGrid = createGrid(inputValues.length, inputValues[0].length);
let knightEl = createKnight(knight);
renderGrid(matrixGrid, gridEl);
statusesEl[STATUSES.HP].innerText = `HP Remaining: ${currentHP}`;

gridEl.addEventListener("click", onTileClick);
btnResetEl?.addEventListener("click", resetBoard);

function createGrid(row: number, col: number): Tile[][] {
	const gameMatrix = [];
	for (let i = 0; i < row; i++) {
		const gameRow: Tile[] = [];
		for (let j = 0; j < col; j++) {
			const tile = new Tile({ y: i, x: j }, inputContent[i][j] as Content, inputValues[i][j]);
			gameRow.push(tile);
		}
		gameMatrix.push(gameRow);
	}
	return gameMatrix;
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
		svgSprite = renderSprite(svgSprite, ENEMIES, Math.floor(tile.value / ENEMIES_RANK), tile.value);

		valueText.innerText = `-${tile.value}`;
		valueText.classList.add("text-value-enemy");

		container.classList.add("tile-enemy");
	} else if (tile.content === "potion") {
		svgSprite = renderSprite(svgSprite, HEALTH, Math.floor(tile.value / HEALTH_RANK), tile.value);

		valueText.innerText = `+${tile.value}`;
		valueText.classList.add("text-value-health");

		container.classList.add("tile-health");
	} else if (tile.content === "start") {
		valueText.innerText = `Start`;
		valueText.classList.add("text-value-start");
		container.classList.add("tile-start");
		container.classList.add("tile-selected");
	} else if (tile.content === "finish") {
		svgSprite = renderSprite(svgSprite, GOAL, 0);
		valueText.innerText = "Goal";
		valueText.classList.add("text-value-goal");
		container.classList.add("tile-finish");
	}
	if (tile.content !== "start") {
		container.appendChild(svgSprite);
	}
	container.appendChild(valueText);
	return container;
}

function renderGrid(matrix: Tile[][], grid_element: HTMLDivElement) {
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
	alert("Victory!");
}

function moveIsValid(curPos: Coord, movePos: Coord) {
	if (movePos.x - curPos.x === 1 && movePos.y === curPos.y) {
		return true;
	} else if (movePos.x === curPos.x && movePos.y - curPos.y === 1) {
		return true;
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
	if (target.tagName === "IMG") {
		target = target.parentElement as HTMLElement;
	}
	if (target && target.dataset.X) {
		console.log("Clicked on " + target.toString());
		console.log(`X: ${target.dataset.X} Y: ${target.dataset.Y}`);
		const targetPos: Coord = { y: parseInt(target.dataset.Y as string), x: parseInt(target.dataset.X as string) };
		if (moveIsValid(currentPos, targetPos)) {
			const newHP = processHP(currentHP, currentPos, targetPos, matrixGrid);
			if (newHP) {
				currentPos = targetPos;
				currentHP = newHP as number;
				target.classList.add("tile-selected");
				statusesEl[STATUSES.HP].innerText = `HP Remaining: ${currentHP}`;
				if (target.classList.contains("tile-finish")) {
					renderVictory();
					resetBoard();
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
	currentPos = START;
	currentHP = inputStartingHP;
	matrixGrid = createGrid(inputValues.length, inputValues[0].length);
	renderGrid(matrixGrid, gridEl);
	statusesEl[STATUSES.HP].innerText = `HP Remaining: ${currentHP}`;
}

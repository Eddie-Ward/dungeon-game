type Coord = {
	y: number;
	x: number;
};

type Content = "potion" | "enemy" | "start" | "finish";

const START: Coord = { y: 0, x: 0 };
const STATUSES = {
	TIME: 0,
	HP: 1,
	SCORE: 2,
};

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

const statusesEl = document.querySelectorAll(".js-status") as NodeListOf<HTMLDivElement>;
const gridEl = document.querySelector(".js-grid") as HTMLDivElement;
const btnHintEl = document.querySelector(".js-btn-hint");
const btnResetEl = document.querySelector(".js-btn-reset");
const btnDifficultyEl = document.querySelector(".js-btn-diff");
const btnDevModeEl = document.querySelector(".js-btn-dev");

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

let currentHP = inputStartingHP;
let currentPos = START;
const matrixGrid = createGrid(inputValues.length, inputValues[0].length);
renderGrid(matrixGrid, gridEl);
statusesEl[STATUSES.HP].innerText = `HP Remaining: ${currentHP}`;
gridEl.addEventListener("click", onTileClick);
btnResetEl?.addEventListener("click", onReset);

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

function renderTile(tile: Tile): HTMLElement {
	const element = document.createElement("div");
	element.dataset.X = tile.pos.x.toString();
	element.dataset.X = tile.pos.x.toString();
	element.dataset.Y = tile.pos.y.toString();
	if (tile.content === "enemy") {
		element.classList.add("tile-enemy");
		element.innerText = (tile.value * -1).toString();
	} else if (tile.content === "potion") {
		element.classList.add("tile-potion");
		element.innerText = tile.value.toString();
	} else if (tile.content === "start") {
		element.classList.add("tile-start");
		element.classList.add("tile-selected");
		element.innerText = `Starting HP: ${inputStartingHP}`;
	} else if (tile.content === "finish") {
		element.classList.add("tile-finish");
		element.innerText = "Treasure!";
	}
	return element;
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
	const target = event.target as HTMLDivElement;
	if (target && target.dataset) {
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
					renderGrid(matrixGrid, gridEl);
					currentHP = inputStartingHP;
					statusesEl[STATUSES.HP].innerText = `HP Remaining: ${currentHP}`;
				}
			} else {
				alert("HP too low to move there!");
			}
		} else {
			alert("Can't move there!");
		}
	}
}

function onReset() {
	currentPos = START;
	currentHP = inputStartingHP;
	const matrixGrid = createGrid(inputValues.length, inputValues[0].length);
	renderGrid(matrixGrid, gridEl);
	statusesEl[STATUSES.HP].innerText = `HP Remaining: ${currentHP}`;
}

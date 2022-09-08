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
// console.log("statusesEl", statusesEl);
const gridEl = document.querySelector(".js-grid") as HTMLDivElement;
// console.log("gridEl", gridEl);
const btnsGameEl = document.querySelector(".js-game-btns");
// console.log("btnsGameEl", btnsGameEl);
const btnsModeEl = document.querySelector(".js-mode-btns");
// console.log("btnsModeEl", btnsModeEl);

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
const gridWidth = 4;
const gridHeight = 4;

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

// gameMatrix.forEach((arr) => {
// 	arr.forEach((tile) => {
// 		console.log`Tile at ${tile.pos} has ${tile.content} at ${tile.value} value`;
// 	});
// });

function renderGrid(matrix: Tile[][], grid_element: HTMLDivElement) {
	statusesEl[STATUSES.HP].innerText = `HP Remaining: ${inputStartingHP}`;
	grid_element.style.gridTemplateColumns = `repeat(${matrix[0].length}, 1fr)`;
	grid_element.style.gridTemplateRows = `repeat(${matrix.length}, 1fr)`;
	for (let i = 0; i < matrix.length; i++) {
		for (let j = 0; j < matrix[0].length; j++) {
			const tile = matrix[i][j];
			const displayTile = document.createElement("div");
			displayTile.dataset.X = tile.pos.x.toString();
			displayTile.dataset.Y = tile.pos.y.toString();
			if (tile.content === "enemy") {
				displayTile.classList.add("tile-enemy");
				displayTile.innerText = (tile.value * -1).toString();
			} else if (tile.content === "potion") {
				displayTile.classList.add("tile-potion");
				displayTile.innerText = tile.value.toString();
			} else if (tile.content === "start") {
				displayTile.classList.add("tile-start");
				displayTile.classList.add("tile-selected");
				displayTile.innerText = `Starting HP: ${inputStartingHP}`;
			} else if (tile.content === "finish") {
				displayTile.classList.add("tile-finish");
				displayTile.innerText = "Treasure!";
			}
			displayTile.style.gridColumnStart = (j + 1).toString();
			displayTile.style.gridRowStart = (i + 1).toString();
			grid_element.appendChild(displayTile);
		}
	}
}

function moveIsValid(curPos: Coord, movePos: Coord) {
	if (movePos.x - curPos.x === 1 && movePos.y === curPos.y) {
		return true;
	} else if (movePos.x === curPos.x && movePos.y - curPos.y === 1) {
		return true;
	}
	return false;
}

const matrixGrid = createGrid(4, 4);
let currentHP = inputStartingHP;
let curPos = START;
renderGrid(matrixGrid, gridEl);

gridEl.addEventListener("click", (event: Event) => {
	const target = event.target as HTMLDivElement;
	if (target && target.dataset) {
		const coords: Coord = { y: parseInt(target.dataset.Y as string), x: parseInt(target.dataset.X as string) };
		if (moveIsValid(curPos, coords)) {
			curPos = coords;
			if (matrixGrid[coords.y][coords.x].content === "enemy") {
				currentHP -= matrixGrid[coords.y][coords.x].value;
				if (currentHP <= 0) {
					alert("Not a valid solution!");
					renderGrid(matrixGrid, gridEl);
					currentHP = inputStartingHP;
					curPos = START;
				}
			} else if (matrixGrid[coords.y][coords.x].content === "potion") {
				currentHP += matrixGrid[coords.y][coords.x].value;
			} else if (matrixGrid[coords.y][coords.x].content === "finish") {
				if (currentHP > 0) {
					alert("Victory!");
				} else {
					alert("Not a valid solution!");
					renderGrid(matrixGrid, gridEl);
					currentHP = inputStartingHP;
					curPos = START;
				}
			}
			target.classList.add("tile-selected");
			statusesEl[STATUSES.HP].innerText = `HP Remaining: ${currentHP}`;
		} else {
			alert("Move not valid!");
		}
	}
});

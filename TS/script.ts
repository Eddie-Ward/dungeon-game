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
const gameMatrix = [];

for (let i = 0; i < gridWidth; i++) {
	const gameRow: Tile[] = [];
	for (let j = 0; j < gridWidth; j++) {
		const tile = new Tile({ y: i, x: j }, inputContent[i][j] as Content, inputValues[i][j]);
		gameRow.push(tile);
	}
	gameMatrix.push(gameRow);
}

gameMatrix.forEach((arr) => {
	arr.forEach((tile) => {
		console.log`Tile at ${tile.pos} has ${tile.content} at ${tile.value} value`;
	});
});

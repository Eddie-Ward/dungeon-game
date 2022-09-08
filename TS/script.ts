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

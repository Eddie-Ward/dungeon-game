"use strict";
const START = { y: 0, x: 0 };
const STATUSES = {
    TIME: 0,
    HP: 1,
    SCORE: 2,
};
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
const statusesEl = document.querySelectorAll(".js-status");
// console.log("statusesEl", statusesEl);
const gridEl = document.querySelector(".js-grid");
// console.log("gridEl", gridEl);
const btnsGameEl = document.querySelector(".js-game-btns");
// console.log("btnsGameEl", btnsGameEl);
const btnsModeEl = document.querySelector(".js-mode-btns");
// console.log("btnsModeEl", btnsModeEl);

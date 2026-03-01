"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const types_1 = require("../types");
class GameController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }
    init() {
        this.view.onGuessSubmit((guess) => this.handleGuess(guess));
        this.view.onNewGame(() => this.handleNewGame());
        this.view.render(this.model.getState());
    }
    handleGuess(guess) {
        if (guess.length !== types_1.CODE_LENGTH) {
            return;
        }
        try {
            this.model.makeGuess(guess);
            this.view.render(this.model.getState());
        }
        catch (e) {
            // Game already over or invalid guess — just re-render current state
            this.view.render(this.model.getState());
        }
    }
    handleNewGame() {
        this.model.reset();
        this.view.render(this.model.getState());
    }
}
exports.GameController = GameController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModel = void 0;
const types_1 = require("../types");
class GameModel {
    constructor(randomFn = Math.random) {
        this.randomFn = randomFn;
        this.secretCode = this.generateCode();
        this.guesses = [];
        this.status = 'playing';
    }
    generateCode() {
        return Array.from({ length: types_1.CODE_LENGTH }, () => types_1.COLORS[Math.floor(this.randomFn() * types_1.COLORS.length)]);
    }
    evaluateGuess(guess, secret) {
        let blacks = 0;
        let whites = 0;
        const secretRemaining = [...secret];
        const guessRemaining = [...guess];
        // First pass: count exact matches (blacks)
        for (let i = 0; i < types_1.CODE_LENGTH; i++) {
            if (guess[i] === secret[i]) {
                blacks++;
                secretRemaining[i] = null;
                guessRemaining[i] = null;
            }
        }
        // Second pass: count color matches in wrong position (whites)
        for (let i = 0; i < types_1.CODE_LENGTH; i++) {
            if (guessRemaining[i] === null)
                continue;
            const idx = secretRemaining.indexOf(guessRemaining[i]);
            if (idx !== -1) {
                whites++;
                secretRemaining[idx] = null;
            }
        }
        return { blacks, whites };
    }
    makeGuess(guess) {
        if (this.status !== 'playing') {
            throw new Error('Game is already over');
        }
        if (guess.length !== types_1.CODE_LENGTH) {
            throw new Error(`Guess must be exactly ${types_1.CODE_LENGTH} colors`);
        }
        const feedback = this.evaluateGuess(guess, this.secretCode);
        this.guesses.push({ guess: [...guess], feedback });
        if (feedback.blacks === types_1.CODE_LENGTH) {
            this.status = 'won';
        }
        else if (this.guesses.length >= types_1.MAX_ATTEMPTS) {
            this.status = 'lost';
        }
        return feedback;
    }
    getState() {
        const isOver = this.status !== 'playing';
        return {
            status: this.status,
            guesses: this.guesses.map(g => ({ guess: [...g.guess], feedback: { ...g.feedback } })),
            secretCode: isOver ? [...this.secretCode] : null,
        };
    }
    reset() {
        this.secretCode = this.generateCode();
        this.guesses = [];
        this.status = 'playing';
    }
}
exports.GameModel = GameModel;

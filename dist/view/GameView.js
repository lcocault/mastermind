"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameView = void 0;
const types_1 = require("../types");
class GameView {
    constructor(root) {
        this.guessSubmitCallback = null;
        this.newGameCallback = null;
        this.root = root;
        this.selectedColors = Array(types_1.CODE_LENGTH).fill(null);
    }
    onGuessSubmit(callback) {
        this.guessSubmitCallback = callback;
    }
    onNewGame(callback) {
        this.newGameCallback = callback;
    }
    render(state) {
        this.selectedColors = Array(types_1.CODE_LENGTH).fill(null);
        this.root.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'mastermind';
        const title = document.createElement('h1');
        title.className = 'title';
        title.textContent = 'Mastermind';
        container.appendChild(title);
        // Status message
        if (state.status !== 'playing') {
            const msg = document.createElement('div');
            msg.className = `status-message status-${state.status}`;
            if (state.status === 'won') {
                msg.textContent = '🎉 You won! Congratulations!';
            }
            else {
                msg.textContent = `😞 Game over! The code was: ${state.secretCode.join(', ')}`;
            }
            container.appendChild(msg);
        }
        // Info bar
        const info = document.createElement('div');
        info.className = 'info-bar';
        const attemptsLeft = types_1.MAX_ATTEMPTS - state.guesses.length;
        info.textContent = state.status === 'playing'
            ? `Attempts remaining: ${attemptsLeft}`
            : `Total guesses: ${state.guesses.length}`;
        container.appendChild(info);
        // Board
        const board = document.createElement('div');
        board.className = 'board';
        // Past guesses (oldest first, newest last)
        for (let i = 0; i < state.guesses.length; i++) {
            const row = this.createGuessRow(state.guesses[i].guess, state.guesses[i].feedback);
            row.dataset.row = String(i);
            board.appendChild(row);
        }
        // Active row (only when playing)
        if (state.status === 'playing') {
            const activeRow = this.createActiveRow();
            board.appendChild(activeRow);
        }
        // Empty placeholder rows
        const filledRows = state.guesses.length + (state.status === 'playing' ? 1 : 0);
        for (let i = filledRows; i < types_1.MAX_ATTEMPTS; i++) {
            const emptyRow = this.createEmptyRow();
            board.appendChild(emptyRow);
        }
        container.appendChild(board);
        // Secret code (if game over)
        if (state.status !== 'playing' && state.secretCode) {
            const secretContainer = document.createElement('div');
            secretContainer.className = 'secret-container';
            const secretLabel = document.createElement('span');
            secretLabel.className = 'secret-label';
            secretLabel.textContent = 'Secret Code: ';
            secretContainer.appendChild(secretLabel);
            state.secretCode.forEach(color => {
                const peg = document.createElement('span');
                peg.className = `peg peg-${color}`;
                secretContainer.appendChild(peg);
            });
            container.appendChild(secretContainer);
        }
        // Color palette (only when playing)
        if (state.status === 'playing') {
            container.appendChild(this.createPalette());
            container.appendChild(this.createSubmitButton());
        }
        // New game button
        const newGameBtn = document.createElement('button');
        newGameBtn.className = 'btn btn-new-game';
        newGameBtn.textContent = 'New Game';
        newGameBtn.addEventListener('click', () => {
            if (this.newGameCallback)
                this.newGameCallback();
        });
        container.appendChild(newGameBtn);
        this.root.appendChild(container);
    }
    createGuessRow(guess, feedback) {
        const row = document.createElement('div');
        row.className = 'guess-row';
        const pegsContainer = document.createElement('div');
        pegsContainer.className = 'pegs-container';
        guess.forEach(color => {
            const peg = document.createElement('span');
            peg.className = `peg peg-${color}`;
            pegsContainer.appendChild(peg);
        });
        row.appendChild(pegsContainer);
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'feedback-container';
        // Black pegs first
        for (let i = 0; i < feedback.blacks; i++) {
            const fp = document.createElement('span');
            fp.className = 'feedback-peg feedback-black';
            feedbackContainer.appendChild(fp);
        }
        // White pegs
        for (let i = 0; i < feedback.whites; i++) {
            const fp = document.createElement('span');
            fp.className = 'feedback-peg feedback-white';
            feedbackContainer.appendChild(fp);
        }
        // Empty pegs
        const empty = types_1.CODE_LENGTH - feedback.blacks - feedback.whites;
        for (let i = 0; i < empty; i++) {
            const fp = document.createElement('span');
            fp.className = 'feedback-peg feedback-empty';
            feedbackContainer.appendChild(fp);
        }
        row.appendChild(feedbackContainer);
        return row;
    }
    createActiveRow() {
        const row = document.createElement('div');
        row.className = 'guess-row active-row';
        const pegsContainer = document.createElement('div');
        pegsContainer.className = 'pegs-container';
        for (let i = 0; i < types_1.CODE_LENGTH; i++) {
            const slot = document.createElement('span');
            slot.className = 'peg peg-empty peg-slot';
            slot.dataset.slot = String(i);
            slot.addEventListener('click', () => this.clearSlot(i, slot));
            pegsContainer.appendChild(slot);
        }
        row.appendChild(pegsContainer);
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'feedback-container';
        for (let i = 0; i < types_1.CODE_LENGTH; i++) {
            const fp = document.createElement('span');
            fp.className = 'feedback-peg feedback-empty';
            feedbackContainer.appendChild(fp);
        }
        row.appendChild(feedbackContainer);
        return row;
    }
    createEmptyRow() {
        const row = document.createElement('div');
        row.className = 'guess-row empty-row';
        const pegsContainer = document.createElement('div');
        pegsContainer.className = 'pegs-container';
        for (let i = 0; i < types_1.CODE_LENGTH; i++) {
            const peg = document.createElement('span');
            peg.className = 'peg peg-empty';
            pegsContainer.appendChild(peg);
        }
        row.appendChild(pegsContainer);
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'feedback-container';
        for (let i = 0; i < types_1.CODE_LENGTH; i++) {
            const fp = document.createElement('span');
            fp.className = 'feedback-peg feedback-empty';
            feedbackContainer.appendChild(fp);
        }
        row.appendChild(feedbackContainer);
        return row;
    }
    createPalette() {
        const palette = document.createElement('div');
        palette.className = 'palette';
        const label = document.createElement('p');
        label.className = 'palette-label';
        label.textContent = 'Select colors for your guess:';
        palette.appendChild(label);
        const colorsContainer = document.createElement('div');
        colorsContainer.className = 'palette-colors';
        types_1.COLORS.forEach(color => {
            const btn = document.createElement('button');
            btn.className = `palette-btn peg peg-${color}`;
            btn.dataset.color = color;
            btn.title = color;
            btn.addEventListener('click', () => this.selectColor(color));
            colorsContainer.appendChild(btn);
        });
        palette.appendChild(colorsContainer);
        return palette;
    }
    createSubmitButton() {
        const btn = document.createElement('button');
        btn.className = 'btn btn-submit';
        btn.textContent = 'Submit Guess';
        btn.addEventListener('click', () => this.submitGuess());
        return btn;
    }
    selectColor(color) {
        const nextEmpty = this.selectedColors.indexOf(null);
        if (nextEmpty === -1)
            return;
        this.selectedColors[nextEmpty] = color;
        const slot = this.root.querySelector(`.peg-slot[data-slot="${nextEmpty}"]`);
        if (slot) {
            slot.className = `peg peg-${color} peg-slot`;
        }
    }
    clearSlot(index, slot) {
        this.selectedColors[index] = null;
        slot.className = 'peg peg-empty peg-slot';
        // Compact: shift non-null colors to front
        const filled = this.selectedColors.filter((c) => c !== null);
        this.selectedColors = [
            ...filled,
            ...Array(types_1.CODE_LENGTH - filled.length).fill(null),
        ];
        // Re-render slots
        const slots = this.root.querySelectorAll('.peg-slot');
        slots.forEach((s, i) => {
            const c = this.selectedColors[i];
            s.className = c ? `peg peg-${c} peg-slot` : 'peg peg-empty peg-slot';
        });
    }
    submitGuess() {
        if (this.selectedColors.includes(null)) {
            alert('Please select all 4 colors before submitting.');
            return;
        }
        if (this.guessSubmitCallback) {
            this.guessSubmitCallback(this.selectedColors);
        }
    }
}
exports.GameView = GameView;

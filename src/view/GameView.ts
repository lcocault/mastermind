import { Color, CLASSIC_CONFIG, GameConfig, GameState, Feedback } from '../types';

export class GameView {
  private root: HTMLElement;
  private config: GameConfig;
  private selectedColors: (Color | null)[];
  private guessSubmitCallback: ((guess: Color[]) => void) | null = null;
  private newGameCallback: (() => void) | null = null;
  private modeSwitchCallback: (() => void) | null = null;
  private positionedRows: Set<number> = new Set();

  constructor(root: HTMLElement, config: GameConfig = CLASSIC_CONFIG) {
    this.root = root;
    this.config = config;
    this.selectedColors = Array(config.codeLength).fill(null);
  }

  onGuessSubmit(callback: (guess: Color[]) => void): void {
    this.guessSubmitCallback = callback;
  }

  onNewGame(callback: () => void): void {
    this.newGameCallback = callback;
  }

  onModeSwitch(callback: () => void): void {
    this.modeSwitchCallback = callback;
  }

  render(state: GameState): void {
    // Clear per-row positioned state at the start of a new game
    if (state.guesses.length === 0) {
      this.positionedRows.clear();
    }
    this.selectedColors = Array(this.config.codeLength).fill(null);
    this.root.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'mastermind';

    const title = document.createElement('h1');
    title.className = 'title';
    title.textContent = this.config.mode === 'super' ? 'Super Mastermind' : 'Mastermind';
    container.appendChild(title);

    // Status message
    if (state.status !== 'playing') {
      const msg = document.createElement('div');
      msg.className = `status-message status-${state.status}`;
      if (state.status === 'won') {
        msg.textContent = '🎉 You won! Congratulations!';
      } else {
        msg.textContent = `😞 Game over! The code was: ${state.secretCode!.join(', ')}`;
      }
      container.appendChild(msg);
    }

    // Info bar
    const info = document.createElement('div');
    info.className = 'info-bar';
    const attemptsLeft = this.config.maxAttempts - state.guesses.length;
    info.textContent = state.status === 'playing'
      ? `Attempts remaining: ${attemptsLeft}`
      : `Total guesses: ${state.guesses.length}`;
    container.appendChild(info);

    // Board
    const board = document.createElement('div');
    board.className = 'board';

    // Past guesses (oldest first, newest last)
    for (let i = 0; i < state.guesses.length; i++) {
      const row = this.createGuessRow(state.guesses[i].guess, state.guesses[i].feedback, i);
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
    for (let i = filledRows; i < this.config.maxAttempts; i++) {
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
      if (this.newGameCallback) this.newGameCallback();
    });
    container.appendChild(newGameBtn);

    // Mode switch button
    const modeBtn = document.createElement('button');
    modeBtn.className = 'btn btn-mode';
    modeBtn.textContent = this.config.mode === 'classic'
      ? 'Switch to Super Mastermind'
      : 'Switch to Classic Mastermind';
    modeBtn.addEventListener('click', () => {
      if (this.modeSwitchCallback) this.modeSwitchCallback();
    });
    container.appendChild(modeBtn);

    this.root.appendChild(container);
  }

  private createGuessRow(guess: Color[], feedback: Feedback, rowIndex: number): HTMLElement {
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

    const buildFeedbackContainer = (positioned: boolean): HTMLElement => {
      const fc = document.createElement('div');
      fc.className = this.config.mode === 'super'
        ? 'feedback-container feedback-inline'
        : 'feedback-container';

      if (positioned && feedback.positions) {
        // `positions` is always the same length as `guess` (guaranteed by GameModel.makeGuess)
        for (const result of feedback.positions) {
          const fp = document.createElement('span');
          fp.className = result === 'miss'
            ? 'feedback-peg feedback-empty'
            : `feedback-peg feedback-${result}`;
          fc.appendChild(fp);
        }
      } else {
        // Classic rendering: blacks first, then whites, then empty
        for (let i = 0; i < feedback.blacks; i++) {
          const fp = document.createElement('span');
          fp.className = 'feedback-peg feedback-black';
          fc.appendChild(fp);
        }
        for (let i = 0; i < feedback.whites; i++) {
          const fp = document.createElement('span');
          fp.className = 'feedback-peg feedback-white';
          fc.appendChild(fp);
        }
        const empty = this.config.codeLength - feedback.blacks - feedback.whites;
        for (let i = 0; i < empty; i++) {
          const fp = document.createElement('span');
          fp.className = 'feedback-peg feedback-empty';
          fc.appendChild(fp);
        }
      }
      return fc;
    };

    let currentFeedbackContainer = buildFeedbackContainer(this.positionedRows.has(rowIndex));
    row.appendChild(currentFeedbackContainer);

    // Per-row toggle button for positioned clues
    const toggleBtn = document.createElement('button');
    const updateToggle = () => {
      const positioned = this.positionedRows.has(rowIndex);
      toggleBtn.className = `btn-positioned-clues${positioned ? ' active' : ''}`;
      toggleBtn.title = positioned ? 'Show grouped clues' : 'Show positioned clues';
    };
    toggleBtn.textContent = '📍';
    toggleBtn.addEventListener('click', () => {
      if (this.positionedRows.has(rowIndex)) {
        this.positionedRows.delete(rowIndex);
      } else {
        this.positionedRows.add(rowIndex);
      }
      updateToggle();
      const newFeedback = buildFeedbackContainer(this.positionedRows.has(rowIndex));
      currentFeedbackContainer.replaceWith(newFeedback);
      currentFeedbackContainer = newFeedback;
    });
    updateToggle();
    row.appendChild(toggleBtn);

    return row;
  }

  private createActiveRow(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'guess-row active-row';

    const pegsContainer = document.createElement('div');
    pegsContainer.className = 'pegs-container';

    for (let i = 0; i < this.config.codeLength; i++) {
      const slot = document.createElement('span');
      slot.className = 'peg peg-empty peg-slot';
      slot.dataset.slot = String(i);
      slot.addEventListener('click', () => this.clearSlot(i, slot));
      pegsContainer.appendChild(slot);
    }
    row.appendChild(pegsContainer);

    const feedbackContainer = document.createElement('div');
    feedbackContainer.className = this.config.mode === 'super'
      ? 'feedback-container feedback-inline'
      : 'feedback-container';
    for (let i = 0; i < this.config.codeLength; i++) {
      const fp = document.createElement('span');
      fp.className = 'feedback-peg feedback-empty';
      feedbackContainer.appendChild(fp);
    }
    row.appendChild(feedbackContainer);

    return row;
  }

  private createEmptyRow(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'guess-row empty-row';

    const pegsContainer = document.createElement('div');
    pegsContainer.className = 'pegs-container';
    for (let i = 0; i < this.config.codeLength; i++) {
      const peg = document.createElement('span');
      peg.className = 'peg peg-empty';
      pegsContainer.appendChild(peg);
    }
    row.appendChild(pegsContainer);

    const feedbackContainer = document.createElement('div');
    feedbackContainer.className = this.config.mode === 'super'
      ? 'feedback-container feedback-inline'
      : 'feedback-container';
    for (let i = 0; i < this.config.codeLength; i++) {
      const fp = document.createElement('span');
      fp.className = 'feedback-peg feedback-empty';
      feedbackContainer.appendChild(fp);
    }
    row.appendChild(feedbackContainer);

    return row;
  }

  private createPalette(): HTMLElement {
    const palette = document.createElement('div');
    palette.className = 'palette';

    const label = document.createElement('p');
    label.className = 'palette-label';
    label.textContent = 'Select colors for your guess:';
    palette.appendChild(label);

    const colorsContainer = document.createElement('div');
    colorsContainer.className = 'palette-colors';

    this.config.colors.forEach(color => {
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

  private createSubmitButton(): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'btn btn-submit';
    btn.textContent = 'Submit Guess';
    btn.addEventListener('click', () => this.submitGuess());
    return btn;
  }

  private selectColor(color: Color): void {
    const nextEmpty = this.selectedColors.indexOf(null);
    if (nextEmpty === -1) return;

    this.selectedColors[nextEmpty] = color;

    const slot = this.root.querySelector<HTMLElement>(`.peg-slot[data-slot="${nextEmpty}"]`);
    if (slot) {
      slot.className = `peg peg-${color} peg-slot`;
    }
  }

  private clearSlot(index: number, slot: HTMLElement): void {
    this.selectedColors[index] = null;
    slot.className = 'peg peg-empty peg-slot';

    // Compact: shift non-null colors to front
    const filled = this.selectedColors.filter((c): c is Color => c !== null);
    this.selectedColors = [
      ...filled,
      ...Array(this.config.codeLength - filled.length).fill(null),
    ];

    // Re-render slots
    const slots = this.root.querySelectorAll<HTMLElement>('.peg-slot');
    slots.forEach((s, i) => {
      const c = this.selectedColors[i];
      s.className = c ? `peg peg-${c} peg-slot` : 'peg peg-empty peg-slot';
    });
  }

  private submitGuess(): void {
    if (this.selectedColors.includes(null)) {
      alert(`Please select all ${this.config.codeLength} colors before submitting.`);
      return;
    }
    if (this.guessSubmitCallback) {
      this.guessSubmitCallback(this.selectedColors as Color[]);
    }
  }
}

import { Color, CLASSIC_CONFIG, GameConfig, Feedback, GuessRecord, GameStatus, GameState } from '../types';

export class GameModel {
  private secretCode: Color[];
  private guesses: GuessRecord[];
  private status: GameStatus;
  private randomFn: () => number;
  private config: GameConfig;

  constructor(randomFn: () => number = Math.random, config: GameConfig = CLASSIC_CONFIG) {
    this.randomFn = randomFn;
    this.config = config;
    this.secretCode = this.generateCode();
    this.guesses = [];
    this.status = 'playing';
  }

  private generateCode(): Color[] {
    return Array.from({ length: this.config.codeLength }, () =>
      this.config.colors[Math.floor(this.randomFn() * this.config.colors.length)]
    );
  }

  evaluateGuess(guess: Color[], secret: Color[]): Feedback {
    let blacks = 0;
    let whites = 0;

    const len = guess.length;
    const secretRemaining: (Color | null)[] = [...secret];
    const guessRemaining: (Color | null)[] = [...guess];

    // First pass: count exact matches (blacks)
    for (let i = 0; i < len; i++) {
      if (guess[i] === secret[i]) {
        blacks++;
        secretRemaining[i] = null;
        guessRemaining[i] = null;
      }
    }

    // Second pass: count color matches in wrong position (whites)
    for (let i = 0; i < len; i++) {
      if (guessRemaining[i] === null) continue;
      const idx = secretRemaining.indexOf(guessRemaining[i] as Color);
      if (idx !== -1) {
        whites++;
        secretRemaining[idx] = null;
      }
    }

    return { blacks, whites };
  }

  makeGuess(guess: Color[]): Feedback {
    if (this.status !== 'playing') {
      throw new Error('Game is already over');
    }
    if (guess.length !== this.config.codeLength) {
      throw new Error(`Guess must be exactly ${this.config.codeLength} colors`);
    }

    const feedback = this.evaluateGuess(guess, this.secretCode);
    this.guesses.push({ guess: [...guess], feedback });

    if (feedback.blacks === this.config.codeLength) {
      this.status = 'won';
    } else if (this.guesses.length >= this.config.maxAttempts) {
      this.status = 'lost';
    }

    return feedback;
  }

  getState(): GameState {
    const isOver = this.status !== 'playing';
    return {
      status: this.status,
      guesses: this.guesses.map(g => ({ guess: [...g.guess], feedback: { ...g.feedback } })),
      secretCode: isOver ? [...this.secretCode] : null,
    };
  }

  reset(): void {
    this.secretCode = this.generateCode();
    this.guesses = [];
    this.status = 'playing';
  }
}

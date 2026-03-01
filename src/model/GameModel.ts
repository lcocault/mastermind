import { Color, COLORS, CODE_LENGTH, MAX_ATTEMPTS, Feedback, GuessRecord, GameStatus, GameState } from '../types';

export class GameModel {
  private secretCode: Color[];
  private guesses: GuessRecord[];
  private status: GameStatus;
  private randomFn: () => number;

  constructor(randomFn: () => number = Math.random) {
    this.randomFn = randomFn;
    this.secretCode = this.generateCode();
    this.guesses = [];
    this.status = 'playing';
  }

  private generateCode(): Color[] {
    return Array.from({ length: CODE_LENGTH }, () =>
      COLORS[Math.floor(this.randomFn() * COLORS.length)]
    );
  }

  evaluateGuess(guess: Color[], secret: Color[]): Feedback {
    let blacks = 0;
    let whites = 0;

    const secretRemaining: (Color | null)[] = [...secret];
    const guessRemaining: (Color | null)[] = [...guess];

    // First pass: count exact matches (blacks)
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (guess[i] === secret[i]) {
        blacks++;
        secretRemaining[i] = null;
        guessRemaining[i] = null;
      }
    }

    // Second pass: count color matches in wrong position (whites)
    for (let i = 0; i < CODE_LENGTH; i++) {
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
    if (guess.length !== CODE_LENGTH) {
      throw new Error(`Guess must be exactly ${CODE_LENGTH} colors`);
    }

    const feedback = this.evaluateGuess(guess, this.secretCode);
    this.guesses.push({ guess: [...guess], feedback });

    if (feedback.blacks === CODE_LENGTH) {
      this.status = 'won';
    } else if (this.guesses.length >= MAX_ATTEMPTS) {
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

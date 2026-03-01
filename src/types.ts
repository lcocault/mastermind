export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple';

export const COLORS: Color[] = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];

export const CODE_LENGTH = 4;

export const MAX_ATTEMPTS = 10;

export interface Feedback {
  blacks: number; // correct color, correct position
  whites: number; // correct color, wrong position
}

export interface GuessRecord {
  guess: Color[];
  feedback: Feedback;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
  status: GameStatus;
  guesses: GuessRecord[];
  secretCode: Color[] | null;
}

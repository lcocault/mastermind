export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'pink' | 'teal';

export const COLORS: Color[] = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];

export const CODE_LENGTH = 4;

export const MAX_ATTEMPTS = 10;

export type GameMode = 'classic' | 'super';

export interface GameConfig {
  mode: GameMode;
  colors: Color[];
  codeLength: number;
  maxAttempts: number;
  positionedClues?: boolean;
}

export const CLASSIC_CONFIG: GameConfig = {
  mode: 'classic',
  colors: ['red', 'blue', 'green', 'yellow', 'orange', 'purple'],
  codeLength: 4,
  maxAttempts: 10,
};

export const SUPER_CONFIG: GameConfig = {
  mode: 'super',
  colors: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'teal'],
  codeLength: 5,
  maxAttempts: 10,
};

export interface Feedback {
  blacks: number; // correct color, correct position
  whites: number; // correct color, wrong position
  positions?: ('black' | 'white' | 'miss')[]; // per-position result (when positionedClues is enabled)
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

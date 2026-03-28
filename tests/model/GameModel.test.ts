import { GameModel } from '../../src/model/GameModel';
import { Color, CODE_LENGTH, MAX_ATTEMPTS, SUPER_CONFIG, CLASSIC_CONFIG } from '../../src/types';

describe('GameModel', () => {
  describe('constructor', () => {
    it('generates a secret code of length 4', () => {
      const model = new GameModel();
      // Secret code is hidden during play
      const state = model.getState();
      expect(state.secretCode).toBeNull();
      expect(state.status).toBe('playing');
      expect(state.guesses).toHaveLength(0);
    });

    it('uses provided randomFn', () => {
      let callCount = 0;
      const fixedRandom = () => { callCount++; return 0; };
      const model = new GameModel(fixedRandom);
      expect(callCount).toBe(CODE_LENGTH);
      // With randomFn always returning 0, code should be all 'red'
      model.makeGuess(['red', 'red', 'red', 'red']);
      const state = model.getState();
      expect(state.status).toBe('won');
    });
  });

  describe('evaluateGuess', () => {
    let model: GameModel;
    beforeEach(() => { model = new GameModel(); });

    it('returns 4 blacks when all correct', () => {
      const secret: Color[] = ['red', 'blue', 'green', 'yellow'];
      const guess: Color[] = ['red', 'blue', 'green', 'yellow'];
      const result = model.evaluateGuess(guess, secret);
      expect(result).toEqual({ blacks: 4, whites: 0 });
    });

    it('returns 0 blacks 0 whites when no matches', () => {
      const secret: Color[] = ['red', 'red', 'red', 'red'];
      const guess: Color[] = ['blue', 'blue', 'blue', 'blue'];
      const result = model.evaluateGuess(guess, secret);
      expect(result).toEqual({ blacks: 0, whites: 0 });
    });

    it('returns 0 blacks 4 whites when all wrong position', () => {
      const secret: Color[] = ['red', 'blue', 'green', 'yellow'];
      const guess: Color[] = ['blue', 'green', 'yellow', 'red'];
      const result = model.evaluateGuess(guess, secret);
      expect(result).toEqual({ blacks: 0, whites: 4 });
    });

    it('returns mix of blacks and whites', () => {
      const secret: Color[] = ['red', 'blue', 'green', 'yellow'];
      const guess: Color[] = ['red', 'green', 'blue', 'orange'];
      const result = model.evaluateGuess(guess, secret);
      expect(result).toEqual({ blacks: 1, whites: 2 });
    });

    it('handles duplicate colors correctly - no double counting', () => {
      // Secret has 1 red, guess has 2 reds in wrong positions
      const secret: Color[] = ['red', 'blue', 'green', 'yellow'];
      const guess: Color[] = ['orange', 'red', 'red', 'purple'];
      const result = model.evaluateGuess(guess, secret);
      // Only 1 white (one red matched, not two)
      expect(result).toEqual({ blacks: 0, whites: 1 });
    });

    it('handles duplicate colors - black takes priority over white', () => {
      const secret: Color[] = ['red', 'red', 'blue', 'blue'];
      const guess: Color[] = ['red', 'blue', 'red', 'blue'];
      const result = model.evaluateGuess(guess, secret);
      // positions 0 and 3 are black; positions 1 and 2 are white
      expect(result).toEqual({ blacks: 2, whites: 2 });
    });

    it('handles all same color in secret with partial matches', () => {
      const secret: Color[] = ['red', 'red', 'red', 'red'];
      const guess: Color[] = ['red', 'blue', 'blue', 'blue'];
      const result = model.evaluateGuess(guess, secret);
      expect(result).toEqual({ blacks: 1, whites: 0 });
    });
  });

  describe('makeGuess', () => {
    it('increments guess count', () => {
      const model = new GameModel(() => 0); // secret: all red
      model.makeGuess(['blue', 'blue', 'blue', 'blue']);
      expect(model.getState().guesses).toHaveLength(1);
    });

    it('stores guess and feedback', () => {
      const model = new GameModel(() => 0); // secret: all red
      model.makeGuess(['red', 'blue', 'blue', 'blue']);
      const { guesses } = model.getState();
      expect(guesses[0].guess).toEqual(['red', 'blue', 'blue', 'blue']);
      expect(guesses[0].feedback.blacks).toBe(1);
      expect(guesses[0].feedback.whites).toBe(0);
      expect(guesses[0].feedback.positions).toEqual(['black', 'miss', 'miss', 'miss']);
    });

    it('sets status to won when all 4 blacks', () => {
      const model = new GameModel(() => 0); // secret: all red
      model.makeGuess(['red', 'red', 'red', 'red']);
      expect(model.getState().status).toBe('won');
    });

    it('sets status to lost after 10 incorrect guesses', () => {
      const model = new GameModel(() => 0); // secret: all red
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        model.makeGuess(['blue', 'blue', 'blue', 'blue']);
      }
      expect(model.getState().status).toBe('lost');
    });

    it('throws error if game is already over', () => {
      const model = new GameModel(() => 0); // secret: all red
      model.makeGuess(['red', 'red', 'red', 'red']); // win
      expect(() => model.makeGuess(['blue', 'blue', 'blue', 'blue'])).toThrow('Game is already over');
    });

    it('throws error for wrong length guess', () => {
      const model = new GameModel();
      expect(() => model.makeGuess(['red', 'blue'] as Color[])).toThrow(`Guess must be exactly ${CODE_LENGTH} colors`);
    });

    it('throws error for empty guess', () => {
      const model = new GameModel();
      expect(() => model.makeGuess([])).toThrow();
    });
  });

  describe('getState', () => {
    it('hides secret code during play', () => {
      const model = new GameModel();
      expect(model.getState().secretCode).toBeNull();
    });

    it('reveals secret code after win', () => {
      const model = new GameModel(() => 0); // secret: all red
      model.makeGuess(['red', 'red', 'red', 'red']);
      const state = model.getState();
      expect(state.secretCode).not.toBeNull();
      expect(state.secretCode).toEqual(['red', 'red', 'red', 'red']);
    });

    it('reveals secret code after loss', () => {
      const model = new GameModel(() => 0); // secret: all red
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        model.makeGuess(['blue', 'blue', 'blue', 'blue']);
      }
      const state = model.getState();
      expect(state.secretCode).not.toBeNull();
      expect(state.secretCode).toEqual(['red', 'red', 'red', 'red']);
    });

    it('returns immutable copies of guesses', () => {
      const model = new GameModel(() => 0);
      model.makeGuess(['blue', 'blue', 'blue', 'blue']);
      const state = model.getState();
      state.guesses[0].guess[0] = 'green';
      // Internal state should not be mutated
      expect(model.getState().guesses[0].guess[0]).toBe('blue');
    });
  });

  describe('reset', () => {
    it('resets to initial playing state', () => {
      const model = new GameModel(() => 0);
      model.makeGuess(['red', 'red', 'red', 'red']); // win
      model.reset();
      const state = model.getState();
      expect(state.status).toBe('playing');
      expect(state.guesses).toHaveLength(0);
      expect(state.secretCode).toBeNull();
    });

    it('generates a new secret code on reset', () => {
      let toggle = false;
      // First 4 calls return 0 (red), next 4 return 1 (blue)
      const mockRandom = () => { const v = toggle ? 1 / 6 : 0; toggle = !toggle; return v; };
      // Actually use a counter approach
      let count = 0;
      const countRandom = () => count++ < CODE_LENGTH ? 0 : 1 / 6;
      const model = new GameModel(countRandom);
      // First secret: all red
      model.makeGuess(['red', 'red', 'red', 'red']);
      expect(model.getState().status).toBe('won');
      model.reset();
      // After reset, new secret: all blue (randomFn now returns 1/6 → index 1)
      model.makeGuess(['blue', 'blue', 'blue', 'blue']);
      expect(model.getState().status).toBe('won');
    });
  });

  describe('Super MasterMind mode', () => {
    it('generates a code of length 5 in super mode', () => {
      let callCount = 0;
      const fixedRandom = () => { callCount++; return 0; };
      const model = new GameModel(fixedRandom, SUPER_CONFIG);
      expect(callCount).toBe(5);
      const state = model.getState();
      expect(state.status).toBe('playing');
      expect(state.secretCode).toBeNull();
    });

    it('uses only super-mode colors when generating code', () => {
      const model = new GameModel(() => 0.99, SUPER_CONFIG);
      // randomFn returns 0.99 → last color in SUPER_CONFIG.colors (teal)
      model.makeGuess(['teal', 'teal', 'teal', 'teal', 'teal']);
      expect(model.getState().status).toBe('won');
    });

    it('requires a 5-color guess in super mode', () => {
      const model = new GameModel(() => 0, SUPER_CONFIG);
      expect(() => model.makeGuess(['red', 'red', 'red', 'red'] as Color[])).toThrow(
        'Guess must be exactly 5 colors'
      );
    });

    it('sets status to won when all 5 blacks', () => {
      const model = new GameModel(() => 0, SUPER_CONFIG);
      model.makeGuess(['red', 'red', 'red', 'red', 'red']);
      expect(model.getState().status).toBe('won');
    });

    it('sets status to lost after 10 incorrect guesses in super mode', () => {
      const model = new GameModel(() => 0, SUPER_CONFIG); // secret: all red
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        model.makeGuess(['blue', 'blue', 'blue', 'blue', 'blue']);
      }
      expect(model.getState().status).toBe('lost');
    });

    it('evaluates 5-color guess correctly', () => {
      const model = new GameModel();
      const secret: Color[] = ['red', 'blue', 'green', 'yellow', 'orange'];
      const guess: Color[] = ['red', 'blue', 'green', 'yellow', 'orange'];
      expect(model.evaluateGuess(guess, secret)).toEqual({ blacks: 5, whites: 0 });
    });
  });

  describe('positioned clues', () => {
    it('always includes positions in feedback', () => {
      const model = new GameModel(() => 0); // secret: all red
      const feedback = model.makeGuess(['red', 'blue', 'blue', 'blue']);
      expect(feedback.positions).toEqual(['black', 'miss', 'miss', 'miss']);
    });

    it('positions reflect exact matches and color-only matches', () => {
      // Control the secret by providing a deterministic randomFn.
      // Secret via index: red=0, blue=1, green=2, yellow=3
      const secret: Color[] = ['red', 'blue', 'green', 'yellow'];
      let idx = 0;
      const colors = CLASSIC_CONFIG.colors;
      const fixedModel = new GameModel(
        () => colors.indexOf(secret[idx++]) / colors.length,
      );
      // guess: ['red', 'green', 'blue', 'orange'] → black at 0, white at 1 and 2, miss at 3
      const feedback = fixedModel.makeGuess(['red', 'green', 'blue', 'orange']);
      expect(feedback.blacks).toBe(1);
      expect(feedback.whites).toBe(2);
      expect(feedback.positions).toEqual(['black', 'white', 'white', 'miss']);
    });

    it('positions stored in GuessRecord are deep copies', () => {
      const model = new GameModel(() => 0); // secret: all red
      model.makeGuess(['red', 'blue', 'blue', 'blue']);
      const state = model.getState();
      state.guesses[0].feedback.positions![0] = 'miss';
      // Internal state must not be mutated
      expect(model.getState().guesses[0].feedback.positions![0]).toBe('black');
    });

    it('all positions are black when all guessed correctly', () => {
      const model = new GameModel(() => 0); // secret: all red
      const feedback = model.makeGuess(['red', 'red', 'red', 'red']);
      expect(feedback.positions).toEqual(['black', 'black', 'black', 'black']);
    });

    it('handles duplicate colors correctly in positioned clues', () => {
      // secret: ['red', 'blue', 'green', 'yellow'] via idx 0,1,2,3
      const secret: Color[] = ['red', 'blue', 'green', 'yellow'];
      let idx = 0;
      const colors = CLASSIC_CONFIG.colors;
      const model = new GameModel(
        () => colors.indexOf(secret[idx++]) / colors.length,
      );
      // guess: ['orange', 'red', 'red', 'purple'] → 0 blacks; only 1 white (one red in secret)
      const feedback = model.makeGuess(['orange', 'red', 'red', 'purple']);
      expect(feedback.blacks).toBe(0);
      expect(feedback.whites).toBe(1);
      // position 1 gets the white (first red found), position 2 is miss (no second red in secret)
      expect(feedback.positions).toEqual(['miss', 'white', 'miss', 'miss']);
    });
  });
});

/**
 * @jest-environment jsdom
 */
import { GameView } from '../../src/view/GameView';
import { GameState, Color } from '../../src/types';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    status: 'playing',
    guesses: [],
    secretCode: null,
    ...overrides,
  };
}

describe('GameView', () => {
  let root: HTMLElement;
  let view: GameView;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    view = new GameView(root);
  });

  afterEach(() => {
    document.body.removeChild(root);
  });

  describe('render', () => {
    it('creates game board elements', () => {
      view.render(makeState());
      expect(root.querySelector('.mastermind')).not.toBeNull();
      expect(root.querySelector('.board')).not.toBeNull();
      expect(root.querySelector('.title')).not.toBeNull();
    });

    it('shows 10 rows total (1 active + 9 empty) at start', () => {
      view.render(makeState());
      const rows = root.querySelectorAll('.guess-row');
      expect(rows.length).toBe(10);
    });

    it('shows correct number of guess rows after guesses', () => {
      const state = makeState({
        guesses: [
          { guess: ['red', 'blue', 'green', 'yellow'], feedback: { blacks: 1, whites: 2 } },
          { guess: ['red', 'red', 'red', 'red'], feedback: { blacks: 2, whites: 0 } },
        ],
      });
      view.render(state);
      const rows = root.querySelectorAll('.guess-row');
      expect(rows.length).toBe(10);
      // First 2 are filled guess rows, row 3 is active, rest are empty
      expect(rows[0].classList.contains('active-row')).toBe(false);
      expect(rows[0].classList.contains('empty-row')).toBe(false);
    });

    it('shows win message when game is won', () => {
      const state = makeState({
        status: 'won',
        guesses: [{ guess: ['red', 'blue', 'green', 'yellow'], feedback: { blacks: 4, whites: 0 } }],
        secretCode: ['red', 'blue', 'green', 'yellow'],
      });
      view.render(state);
      const msg = root.querySelector('.status-won');
      expect(msg).not.toBeNull();
      expect(msg!.textContent).toContain('won');
    });

    it('shows loss message when game is lost', () => {
      const state = makeState({
        status: 'lost',
        guesses: [],
        secretCode: ['red', 'blue', 'green', 'yellow'],
      });
      view.render(state);
      const msg = root.querySelector('.status-lost');
      expect(msg).not.toBeNull();
      expect(msg!.textContent).toContain('Game over');
    });

    it('shows color palette when playing', () => {
      view.render(makeState());
      expect(root.querySelector('.palette')).not.toBeNull();
      const colorBtns = root.querySelectorAll('.palette-btn');
      expect(colorBtns.length).toBe(6);
    });

    it('hides color palette when game is over', () => {
      view.render(makeState({ status: 'won', secretCode: ['red', 'blue', 'green', 'yellow'] }));
      expect(root.querySelector('.palette')).toBeNull();
    });

    it('shows new game button always', () => {
      view.render(makeState());
      expect(root.querySelector('.btn-new-game')).not.toBeNull();
    });

    it('shows feedback pegs: blacks first then whites', () => {
      const state = makeState({
        guesses: [
          { guess: ['red', 'blue', 'green', 'yellow'], feedback: { blacks: 2, whites: 1 } },
        ],
      });
      view.render(state);
      const feedbackPegs = root.querySelectorAll('.feedback-peg');
      // First feedback container: 2 black, 1 white, 1 empty
      const blackPegs = root.querySelectorAll('.feedback-black');
      const whitePegs = root.querySelectorAll('.feedback-white');
      expect(blackPegs.length).toBe(2);
      expect(whitePegs.length).toBe(1);
    });

    it('displays secret code when game is over', () => {
      const state = makeState({
        status: 'lost',
        secretCode: ['red', 'blue', 'green', 'yellow'],
      });
      view.render(state);
      expect(root.querySelector('.secret-container')).not.toBeNull();
    });
  });

  describe('color selection', () => {
    beforeEach(() => {
      view.render(makeState());
    });

    it('fills a slot when a color is clicked', () => {
      const redBtn = root.querySelector<HTMLElement>('[data-color="red"]');
      expect(redBtn).not.toBeNull();
      redBtn!.click();
      const slot0 = root.querySelector<HTMLElement>('.peg-slot[data-slot="0"]');
      expect(slot0!.className).toContain('peg-red');
    });

    it('fills slots in order', () => {
      const colors: Color[] = ['red', 'blue', 'green', 'yellow'];
      colors.forEach(c => {
        root.querySelector<HTMLElement>(`[data-color="${c}"]`)!.click();
      });
      for (let i = 0; i < 4; i++) {
        const slot = root.querySelector<HTMLElement>(`.peg-slot[data-slot="${i}"]`);
        expect(slot!.className).toContain(`peg-${colors[i]}`);
      }
    });
  });

  describe('callbacks', () => {
    it('triggers new game callback on new game button click', () => {
      const callback = jest.fn();
      view.onNewGame(callback);
      view.render(makeState());
      root.querySelector<HTMLElement>('.btn-new-game')!.click();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('triggers guess submit callback with selected colors', () => {
      const callback = jest.fn();
      view.onGuessSubmit(callback);
      view.render(makeState());

      // Select 4 colors
      const colors: Color[] = ['red', 'blue', 'green', 'yellow'];
      colors.forEach(c => {
        root.querySelector<HTMLElement>(`[data-color="${c}"]`)!.click();
      });

      root.querySelector<HTMLElement>('.btn-submit')!.click();
      expect(callback).toHaveBeenCalledWith(['red', 'blue', 'green', 'yellow']);
    });

    it('does not submit if not all slots are filled', () => {
      const callback = jest.fn();
      view.onGuessSubmit(callback);

      // Mock alert to prevent jsdom error
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

      view.render(makeState());
      // Only select 2 colors
      root.querySelector<HTMLElement>('[data-color="red"]')!.click();
      root.querySelector<HTMLElement>('[data-color="blue"]')!.click();
      root.querySelector<HTMLElement>('.btn-submit')!.click();

      expect(callback).not.toHaveBeenCalled();
      alertMock.mockRestore();
    });
  });
});

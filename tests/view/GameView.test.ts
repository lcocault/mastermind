/**
 * @jest-environment jsdom
 */
import { GameView } from '../../src/view/GameView';
import { GameState, Color, SUPER_CONFIG, CLASSIC_CONFIG, GameConfig } from '../../src/types';

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

  describe('mode switch button', () => {
    it('shows a mode switch button in classic mode', () => {
      view.render(makeState());
      const modeBtn = root.querySelector('.btn-mode');
      expect(modeBtn).not.toBeNull();
      expect(modeBtn!.textContent).toContain('Super Mastermind');
    });

    it('triggers mode switch callback when clicked', () => {
      const callback = jest.fn();
      view.onModeSwitch(callback);
      view.render(makeState());
      root.querySelector<HTMLElement>('.btn-mode')!.click();
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Super MasterMind mode', () => {
    let superRoot: HTMLElement;
    let superView: GameView;

    beforeEach(() => {
      superRoot = document.createElement('div');
      document.body.appendChild(superRoot);
      superView = new GameView(superRoot, SUPER_CONFIG);
    });

    afterEach(() => {
      document.body.removeChild(superRoot);
    });

    it('shows "Super Mastermind" as the title', () => {
      superView.render(makeState());
      const title = superRoot.querySelector('.title');
      expect(title!.textContent).toBe('Super Mastermind');
    });

    it('shows 8 color buttons in the palette', () => {
      superView.render(makeState());
      const colorBtns = superRoot.querySelectorAll('.palette-btn');
      expect(colorBtns.length).toBe(8);
    });

    it('shows pink and teal color buttons', () => {
      superView.render(makeState());
      expect(superRoot.querySelector('[data-color="pink"]')).not.toBeNull();
      expect(superRoot.querySelector('[data-color="teal"]')).not.toBeNull();
    });

    it('creates 5 peg slots in the active row', () => {
      superView.render(makeState());
      const slots = superRoot.querySelectorAll('.peg-slot');
      expect(slots.length).toBe(5);
    });

    it('uses inline feedback layout for super mode', () => {
      const state = makeState({
        guesses: [
          {
            guess: ['red', 'blue', 'green', 'yellow', 'orange'],
            feedback: { blacks: 2, whites: 1 },
          },
        ],
      });
      superView.render(state);
      const feedbackContainers = superRoot.querySelectorAll('.feedback-container');
      // All rows (past guess, active row, empty rows) must use the inline class so
      // the 5 feedback pegs are horizontally aligned in a single row.
      feedbackContainers.forEach(container => {
        expect(container.classList.contains('feedback-inline')).toBe(true);
      });
    });

    it('uses inline feedback layout for all rows on initial render', () => {
      superView.render(makeState());
      const feedbackContainers = superRoot.querySelectorAll('.feedback-container');
      // 10 rows total: 1 active + 9 empty – all must display feedback pegs inline
      expect(feedbackContainers.length).toBe(10);
      feedbackContainers.forEach(container => {
        expect(container.classList.contains('feedback-inline')).toBe(true);
      });
    });

    it('shows switch-to-classic button in super mode', () => {
      superView.render(makeState());
      const modeBtn = superRoot.querySelector('.btn-mode');
      expect(modeBtn).not.toBeNull();
      expect(modeBtn!.textContent).toContain('Classic Mastermind');
    });

    it('fills 5 slots in order for super mode', () => {
      superView.render(makeState());
      const colors: Color[] = ['red', 'blue', 'green', 'yellow', 'orange'];
      colors.forEach(c => {
        superRoot.querySelector<HTMLElement>(`[data-color="${c}"]`)!.click();
      });
      for (let i = 0; i < 5; i++) {
        const slot = superRoot.querySelector<HTMLElement>(`.peg-slot[data-slot="${i}"]`);
        expect(slot!.className).toContain(`peg-${colors[i]}`);
      }
    });

    it('submits a 5-color guess', () => {
      const callback = jest.fn();
      superView.onGuessSubmit(callback);
      superView.render(makeState());

      const colors: Color[] = ['red', 'blue', 'green', 'yellow', 'orange'];
      colors.forEach(c => {
        superRoot.querySelector<HTMLElement>(`[data-color="${c}"]`)!.click();
      });
      superRoot.querySelector<HTMLElement>('.btn-submit')!.click();
      expect(callback).toHaveBeenCalledWith(['red', 'blue', 'green', 'yellow', 'orange']);
    });
  });

  describe('positioned clues per-row toggle', () => {
    let posRoot: HTMLElement;
    let posView: GameView;

    beforeEach(() => {
      posRoot = document.createElement('div');
      document.body.appendChild(posRoot);
      posView = new GameView(posRoot, CLASSIC_CONFIG);
    });

    afterEach(() => {
      document.body.removeChild(posRoot);
    });

    it('renders a positioned-clues toggle button on each guess row', () => {
      const state = makeState({
        guesses: [
          { guess: ['red', 'blue', 'green', 'yellow'], feedback: { blacks: 1, whites: 2, positions: ['black', 'miss', 'white', 'white'] } },
        ],
      });
      posView.render(state);
      const toggleBtn = posRoot.querySelector('[data-row="0"] .btn-positioned-clues');
      expect(toggleBtn).not.toBeNull();
    });

    it('shows classic grouped rendering by default (blacks before whites)', () => {
      const state = makeState({
        guesses: [
          { guess: ['red', 'blue', 'green', 'yellow'], feedback: { blacks: 2, whites: 1, positions: ['black', 'black', 'white', 'miss'] } },
        ],
      });
      posView.render(state);
      const guessRow = posRoot.querySelector('[data-row="0"]')!;
      const feedbackPegs = guessRow.querySelectorAll('.feedback-peg');
      // Classic: 2 blacks grouped first, then 1 white, then 1 empty
      expect(feedbackPegs[0].classList.contains('feedback-black')).toBe(true);
      expect(feedbackPegs[1].classList.contains('feedback-black')).toBe(true);
      expect(feedbackPegs[2].classList.contains('feedback-white')).toBe(true);
      expect(feedbackPegs[3].classList.contains('feedback-empty')).toBe(true);
    });

    it('renders feedback pegs in positioned order after toggle is clicked', () => {
      const state = makeState({
        guesses: [
          {
            guess: ['red', 'blue', 'green', 'yellow'],
            feedback: {
              blacks: 1,
              whites: 1,
              positions: ['black', 'miss', 'white', 'miss'],
            },
          },
        ],
      });
      posView.render(state);
      const guessRow = posRoot.querySelector('[data-row="0"]')!;

      // Click the toggle to enable positioned clues for this row
      const toggleBtn = guessRow.querySelector<HTMLElement>('.btn-positioned-clues')!;
      toggleBtn.click();

      const feedbackPegs = guessRow.querySelectorAll('.feedback-peg');
      expect(feedbackPegs[0].classList.contains('feedback-black')).toBe(true);
      expect(feedbackPegs[1].classList.contains('feedback-empty')).toBe(true);
      expect(feedbackPegs[2].classList.contains('feedback-white')).toBe(true);
      expect(feedbackPegs[3].classList.contains('feedback-empty')).toBe(true);
    });

    it('toggles back to classic grouped rendering on second click', () => {
      const state = makeState({
        guesses: [
          {
            guess: ['red', 'blue', 'green', 'yellow'],
            feedback: {
              blacks: 2,
              whites: 1,
              positions: ['black', 'black', 'white', 'miss'],
            },
          },
        ],
      });
      posView.render(state);
      const guessRow = posRoot.querySelector('[data-row="0"]')!;
      const toggleBtn = guessRow.querySelector<HTMLElement>('.btn-positioned-clues')!;

      toggleBtn.click(); // enable positioned
      toggleBtn.click(); // back to classic

      const feedbackPegs = guessRow.querySelectorAll('.feedback-peg');
      // Back to classic: blacks grouped first
      expect(feedbackPegs[0].classList.contains('feedback-black')).toBe(true);
      expect(feedbackPegs[1].classList.contains('feedback-black')).toBe(true);
      expect(feedbackPegs[2].classList.contains('feedback-white')).toBe(true);
    });

    it('toggle button gets active class when positioned clues are shown', () => {
      const state = makeState({
        guesses: [
          { guess: ['red', 'blue', 'green', 'yellow'], feedback: { blacks: 1, whites: 0, positions: ['black', 'miss', 'miss', 'miss'] } },
        ],
      });
      posView.render(state);
      const toggleBtn = posRoot.querySelector<HTMLElement>('[data-row="0"] .btn-positioned-clues')!;

      expect(toggleBtn.classList.contains('active')).toBe(false);
      toggleBtn.click();
      expect(toggleBtn.classList.contains('active')).toBe(true);
    });

    it('toggling one row does not affect other rows', () => {
      const state = makeState({
        guesses: [
          { guess: ['red', 'blue', 'green', 'yellow'], feedback: { blacks: 1, whites: 0, positions: ['black', 'miss', 'miss', 'miss'] } },
          { guess: ['red', 'blue', 'green', 'yellow'], feedback: { blacks: 2, whites: 0, positions: ['black', 'black', 'miss', 'miss'] } },
        ],
      });
      posView.render(state);

      // Toggle row 0 only
      posRoot.querySelector<HTMLElement>('[data-row="0"] .btn-positioned-clues')!.click();

      // Row 0 should show positioned (black at position 0, empty at 1-3)
      const row0Pegs = posRoot.querySelectorAll('[data-row="0"] .feedback-peg');
      expect(row0Pegs[0].classList.contains('feedback-black')).toBe(true);
      expect(row0Pegs[1].classList.contains('feedback-empty')).toBe(true);

      // Row 1 should still show classic (blacks grouped first)
      const row1Pegs = posRoot.querySelectorAll('[data-row="1"] .feedback-peg');
      expect(row1Pegs[0].classList.contains('feedback-black')).toBe(true);
      expect(row1Pegs[1].classList.contains('feedback-black')).toBe(true);
      expect(row1Pegs[2].classList.contains('feedback-empty')).toBe(true);
    });
  });

  describe('French language', () => {
    const FR_CONFIG: GameConfig = { ...CLASSIC_CONFIG, language: 'fr' };
    let frRoot: HTMLElement;
    let frView: GameView;

    beforeEach(() => {
      frRoot = document.createElement('div');
      document.body.appendChild(frRoot);
      frView = new GameView(frRoot, FR_CONFIG);
    });

    afterEach(() => {
      document.body.removeChild(frRoot);
    });

    it('shows French win message', () => {
      frView.render(makeState({ status: 'won', secretCode: ['red', 'blue', 'green', 'yellow'] }));
      const msg = frRoot.querySelector('.status-won');
      expect(msg!.textContent).toContain('gagné');
    });

    it('shows French loss message', () => {
      frView.render(makeState({ status: 'lost', secretCode: ['red', 'blue', 'green', 'yellow'] }));
      const msg = frRoot.querySelector('.status-lost');
      expect(msg!.textContent).toContain('Partie terminée');
    });

    it('shows French attempts remaining text', () => {
      frView.render(makeState());
      const info = frRoot.querySelector('.info-bar');
      expect(info!.textContent).toContain('Essais restants');
    });

    it('shows French total guesses text when game is over', () => {
      frView.render(makeState({
        status: 'won',
        guesses: [{ guess: ['red', 'blue', 'green', 'yellow'], feedback: { blacks: 4, whites: 0 } }],
        secretCode: ['red', 'blue', 'green', 'yellow'],
      }));
      const info = frRoot.querySelector('.info-bar');
      expect(info!.textContent).toContain('Total des essais');
    });

    it('shows French new game button', () => {
      frView.render(makeState());
      const btn = frRoot.querySelector('.btn-new-game');
      expect(btn!.textContent).toBe('Nouvelle partie');
    });

    it('shows French mode switch button in classic mode', () => {
      frView.render(makeState());
      const btn = frRoot.querySelector('.btn-mode');
      expect(btn!.textContent).toContain('Super Mastermind');
    });

    it('shows French palette label', () => {
      frView.render(makeState());
      const label = frRoot.querySelector('.palette-label');
      expect(label!.textContent).toContain('Sélectionnez');
    });

    it('shows French submit button', () => {
      frView.render(makeState());
      const btn = frRoot.querySelector('.btn-submit');
      expect(btn!.textContent).toBe('Valider');
    });

    it('shows French secret code label when game is over', () => {
      frView.render(makeState({ status: 'lost', secretCode: ['red', 'blue', 'green', 'yellow'] }));
      const label = frRoot.querySelector('.secret-label');
      expect(label!.textContent).toContain('Code secret');
    });

    it('shows language switch button labeled "English" in French mode', () => {
      frView.render(makeState());
      const btn = frRoot.querySelector('.btn-language');
      expect(btn!.textContent).toBe('English');
    });

    it('shows language switch button labeled "Français" in English mode', () => {
      view.render(makeState());
      const btn = root.querySelector('.btn-language');
      expect(btn!.textContent).toBe('Français');
    });

    it('triggers language switch callback when language button is clicked', () => {
      const callback = jest.fn();
      frView.onLanguageSwitch(callback);
      frView.render(makeState());
      frRoot.querySelector<HTMLElement>('.btn-language')!.click();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('shows French positioned clues toggle tooltip', () => {
      const state = makeState({
        guesses: [
          { guess: ['red', 'blue', 'green', 'yellow'], feedback: { blacks: 1, whites: 0, positions: ['black', 'miss', 'miss', 'miss'] } },
        ],
      });
      frView.render(state);
      const toggleBtn = frRoot.querySelector<HTMLElement>('[data-row="0"] .btn-positioned-clues')!;
      expect(toggleBtn.title).toContain('Afficher les indices positionnés');
      toggleBtn.click();
      expect(toggleBtn.title).toContain('Afficher les indices groupés');
    });
  });
});

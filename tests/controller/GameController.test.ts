import { GameController } from '../../src/controller/GameController';
import { GameModel } from '../../src/model/GameModel';
import { GameView } from '../../src/view/GameView';
import { GameState, Color } from '../../src/types';

// Mock GameModel
jest.mock('../../src/model/GameModel');
// Mock GameView
jest.mock('../../src/view/GameView');

const MockedGameModel = GameModel as jest.MockedClass<typeof GameModel>;
const MockedGameView = GameView as jest.MockedClass<typeof GameView>;

describe('GameController', () => {
  let model: jest.Mocked<GameModel>;
  let view: jest.Mocked<GameView>;
  let controller: GameController;

  const initialState: GameState = {
    status: 'playing',
    guesses: [],
    secretCode: null,
  };

  beforeEach(() => {
    MockedGameModel.mockClear();
    MockedGameView.mockClear();

    model = new MockedGameModel() as jest.Mocked<GameModel>;
    view = new MockedGameView(document.createElement('div')) as jest.Mocked<GameView>;

    model.getState.mockReturnValue(initialState);
    model.makeGuess.mockReturnValue({ blacks: 0, whites: 0 });

    controller = new GameController(model, view);
  });

  describe('init', () => {
    it('renders initial state', () => {
      controller.init();
      expect(view.render).toHaveBeenCalledWith(initialState);
    });

    it('registers guess submit callback', () => {
      controller.init();
      expect(view.onGuessSubmit).toHaveBeenCalledWith(expect.any(Function));
    });

    it('registers new game callback', () => {
      controller.init();
      expect(view.onNewGame).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('guess submission', () => {
    it('calls model.makeGuess and re-renders on valid guess', () => {
      let guessCallback: ((guess: Color[]) => void) | null = null;
      view.onGuessSubmit.mockImplementation((cb) => { guessCallback = cb; });

      const afterGuessState: GameState = {
        status: 'playing',
        guesses: [{ guess: ['red', 'blue', 'green', 'yellow'], feedback: { blacks: 1, whites: 0 } }],
        secretCode: null,
      };
      model.getState
        .mockReturnValueOnce(initialState)   // for init render
        .mockReturnValueOnce(afterGuessState); // for re-render after guess

      controller.init();
      expect(guessCallback).not.toBeNull();

      guessCallback!(['red', 'blue', 'green', 'yellow']);

      expect(model.makeGuess).toHaveBeenCalledWith(['red', 'blue', 'green', 'yellow']);
      expect(view.render).toHaveBeenCalledTimes(2);
      expect(view.render).toHaveBeenLastCalledWith(afterGuessState);
    });

    it('ignores guess with wrong length', () => {
      let guessCallback: ((guess: Color[]) => void) | null = null;
      view.onGuessSubmit.mockImplementation((cb) => { guessCallback = cb; });
      model.getState.mockReturnValue(initialState);

      controller.init();
      guessCallback!(['red', 'blue'] as Color[]);

      expect(model.makeGuess).not.toHaveBeenCalled();
    });

    it('still re-renders if model.makeGuess throws', () => {
      let guessCallback: ((guess: Color[]) => void) | null = null;
      view.onGuessSubmit.mockImplementation((cb) => { guessCallback = cb; });
      model.makeGuess.mockImplementation(() => { throw new Error('Game is already over'); });
      model.getState.mockReturnValue(initialState);

      controller.init();
      guessCallback!(['red', 'blue', 'green', 'yellow']);

      // render called twice: once in init, once after the error
      expect(view.render).toHaveBeenCalledTimes(2);
    });
  });

  describe('new game', () => {
    it('calls model.reset and re-renders', () => {
      let newGameCallback: (() => void) | null = null;
      view.onNewGame.mockImplementation((cb) => { newGameCallback = cb; });
      model.getState.mockReturnValue(initialState);

      controller.init();
      newGameCallback!();

      expect(model.reset).toHaveBeenCalledTimes(1);
      expect(view.render).toHaveBeenCalledTimes(2);
    });
  });
});

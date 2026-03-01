import { GameModel } from '../model/GameModel';
import { GameView } from '../view/GameView';
import { Color, CODE_LENGTH } from '../types';

export class GameController {
  private model: GameModel;
  private view: GameView;

  constructor(model: GameModel, view: GameView) {
    this.model = model;
    this.view = view;
  }

  init(): void {
    this.view.onGuessSubmit((guess: Color[]) => this.handleGuess(guess));
    this.view.onNewGame(() => this.handleNewGame());
    this.view.render(this.model.getState());
  }

  private handleGuess(guess: Color[]): void {
    if (guess.length !== CODE_LENGTH) {
      return;
    }
    try {
      this.model.makeGuess(guess);
      this.view.render(this.model.getState());
    } catch (e) {
      // Game already over or invalid guess — just re-render current state
      this.view.render(this.model.getState());
    }
  }

  private handleNewGame(): void {
    this.model.reset();
    this.view.render(this.model.getState());
  }
}

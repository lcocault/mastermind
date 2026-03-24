import { GameModel } from '../model/GameModel';
import { GameView } from '../view/GameView';
import { Color, CLASSIC_CONFIG, GameConfig } from '../types';

export class GameController {
  private model: GameModel;
  private view: GameView;
  private config: GameConfig;

  constructor(model: GameModel, view: GameView, config: GameConfig = CLASSIC_CONFIG) {
    this.model = model;
    this.view = view;
    this.config = config;
  }

  init(): void {
    this.view.onGuessSubmit((guess: Color[]) => this.handleGuess(guess));
    this.view.onNewGame(() => this.handleNewGame());
    this.view.render(this.model.getState());
  }

  private handleGuess(guess: Color[]): void {
    if (guess.length !== this.config.codeLength) {
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

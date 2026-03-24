import { GameModel } from './model/GameModel';
import { GameView } from './view/GameView';
import { GameController } from './controller/GameController';
import { CLASSIC_CONFIG, SUPER_CONFIG, GameConfig } from './types';

function startGame(config: GameConfig): void {
  const root = document.getElementById('app');
  if (!root) throw new Error('No #app element found');

  const model = new GameModel(Math.random, config);
  const view = new GameView(root, config);
  const controller = new GameController(model, view, config);

  view.onModeSwitch(() => {
    const newConfig = config.mode === 'classic' ? SUPER_CONFIG : CLASSIC_CONFIG;
    startGame(newConfig);
  });

  controller.init();
}

startGame(CLASSIC_CONFIG);

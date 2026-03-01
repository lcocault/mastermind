import { GameModel } from './model/GameModel';
import { GameView } from './view/GameView';
import { GameController } from './controller/GameController';

const root = document.getElementById('app');
if (!root) throw new Error('No #app element found');

const model = new GameModel();
const view = new GameView(root);
const controller = new GameController(model, view);
controller.init();

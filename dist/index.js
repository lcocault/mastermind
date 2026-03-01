"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GameModel_1 = require("./model/GameModel");
const GameView_1 = require("./view/GameView");
const GameController_1 = require("./controller/GameController");
const root = document.getElementById('app');
if (!root)
    throw new Error('No #app element found');
const model = new GameModel_1.GameModel();
const view = new GameView_1.GameView(root);
const controller = new GameController_1.GameController(model, view);
controller.init();

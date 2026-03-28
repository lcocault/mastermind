import { Language } from './types';

export interface Labels {
  title: string;
  superTitle: string;
  wonMessage: string;
  lostMessage: (code: string) => string;
  attemptsRemaining: (n: number) => string;
  totalGuesses: (n: number) => string;
  secretCodeLabel: string;
  newGame: string;
  switchToSuper: string;
  switchToClassic: string;
  showGroupedClues: string;
  showPositionedClues: string;
  paletteLabel: string;
  submitGuess: string;
  incompleteSelection: (n: number) => string;
  switchLanguage: string;
}

const en: Labels = {
  title: 'Mastermind',
  superTitle: 'Super Mastermind',
  wonMessage: '🎉 You won! Congratulations!',
  lostMessage: (code) => `😞 Game over! The code was: ${code}`,
  attemptsRemaining: (n) => `Attempts remaining: ${n}`,
  totalGuesses: (n) => `Total guesses: ${n}`,
  secretCodeLabel: 'Secret Code: ',
  newGame: 'New Game',
  switchToSuper: 'Switch to Super Mastermind',
  switchToClassic: 'Switch to Classic Mastermind',
  showGroupedClues: 'Show grouped clues',
  showPositionedClues: 'Show positioned clues',
  paletteLabel: 'Select colors for your guess:',
  submitGuess: 'Submit Guess',
  incompleteSelection: (n) => `Please select all ${n} colors before submitting.`,
  switchLanguage: 'Français',
};

const fr: Labels = {
  title: 'Mastermind',
  superTitle: 'Super Mastermind',
  wonMessage: '🎉 Vous avez gagné ! Félicitations !',
  lostMessage: (code) => `😞 Partie terminée ! Le code était : ${code}`,
  attemptsRemaining: (n) => `Essais restants : ${n}`,
  totalGuesses: (n) => `Total des essais : ${n}`,
  secretCodeLabel: 'Code secret : ',
  newGame: 'Nouvelle partie',
  switchToSuper: 'Passer en Super Mastermind',
  switchToClassic: 'Passer en Mastermind Classique',
  showGroupedClues: 'Afficher les indices groupés',
  showPositionedClues: 'Afficher les indices positionnés',
  paletteLabel: 'Sélectionnez les couleurs pour votre essai :',
  submitGuess: 'Valider',
  incompleteSelection: (n) => `Veuillez sélectionner les ${n} couleurs avant de valider.`,
  switchLanguage: 'English',
};

export function getLabels(language: Language = 'en'): Labels {
  return language === 'fr' ? fr : en;
}

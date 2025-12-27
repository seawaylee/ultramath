import { Operation, GameSettings, Question, Difficulty } from '../types';

export const generateQuestion = (settings: GameSettings, index: number): Question => {
  let num1 = 0;
  let num2 = 0;
  let answer = 0;
  
  // Randomly select an operation from allowed list
  const op = settings.operations[Math.floor(Math.random() * settings.operations.length)];

  // Helper to generate random int
  const randomInt = (max: number) => Math.floor(Math.random() * max) + 1;
  const range = settings.range;

  // Logic to ensure valid questions based on constraints (no negatives unless allowed, etc.)
  switch (op) {
    case Operation.ADD:
      num1 = randomInt(range);
      num2 = randomInt(range);
      // If decimals allowed, occasionally add decimals
      if (settings.allowDecimals && Math.random() > 0.7) {
         num1 = parseFloat((Math.random() * range).toFixed(1));
         num2 = parseFloat((Math.random() * range).toFixed(1));
      }
      answer = num1 + num2;
      break;

    case Operation.SUBTRACT:
      num1 = randomInt(range);
      num2 = randomInt(range);
      if (settings.allowDecimals && Math.random() > 0.7) {
        num1 = parseFloat((Math.random() * range).toFixed(1));
        num2 = parseFloat((Math.random() * range).toFixed(1));
      }
      // Swap if negatives not allowed
      if (!settings.allowNegative && num1 < num2) {
        [num1, num2] = [num2, num1];
      }
      answer = num1 - num2;
      break;

    case Operation.MULTIPLY:
      // Reduce range for multiplication to keep it mentally doable unless on Hard
      const multRange = settings.range > 20 ? Math.ceil(Math.sqrt(settings.range)) + 5 : settings.range;
      num1 = randomInt(multRange);
      num2 = randomInt(multRange);
      answer = num1 * num2;
      break;

    case Operation.DIVIDE:
      // Generate multiplication first to ensure clean division
      const divRange = settings.range > 20 ? Math.ceil(Math.sqrt(settings.range)) + 5 : settings.range;
      const factor2 = randomInt(divRange);
      const factor1 = randomInt(divRange);
      
      num2 = factor2; // Divisor
      num1 = factor1 * factor2; // Dividend
      answer = factor1;
      
      if (settings.allowDecimals && Math.random() > 0.8) {
         // Create simple decimal division: e.g. 5 / 2 = 2.5
         num1 = randomInt(20);
         num2 = 2; 
         answer = num1 / num2;
      }
      break;
  }

  // Round answers to 2 decimals if they are floats
  if (settings.allowDecimals) {
    answer = parseFloat(answer.toFixed(2));
  }

  return {
    id: `q-${Date.now()}-${index}`,
    num1,
    num2,
    operation: op,
    correctAnswer: answer
  };
};

export const getNextDifficulty = (current: Difficulty): Difficulty => {
  switch (current) {
    case Difficulty.C: return Difficulty.B;
    case Difficulty.B: return Difficulty.A;
    case Difficulty.A: return Difficulty.S;
    default: return Difficulty.S;
  }
};

export const getDefaultSettings = (diff: Difficulty): GameSettings => {
  switch (diff) {
    case Difficulty.C: // Easy 10
      return { operations: [Operation.ADD, Operation.SUBTRACT], range: 10, allowDecimals: false, allowNegative: false, difficulty: Difficulty.C };
    case Difficulty.B: // Medium 20
      return { operations: [Operation.ADD, Operation.SUBTRACT, Operation.MULTIPLY], range: 20, allowDecimals: false, allowNegative: false, difficulty: Difficulty.B };
    case Difficulty.A: // Hard 50
      return { operations: [Operation.ADD, Operation.SUBTRACT, Operation.MULTIPLY, Operation.DIVIDE], range: 50, allowDecimals: false, allowNegative: true, difficulty: Difficulty.A };
    case Difficulty.S: // Ultra 100
      return { operations: [Operation.ADD, Operation.SUBTRACT, Operation.MULTIPLY, Operation.DIVIDE], range: 100, allowDecimals: true, allowNegative: true, difficulty: Difficulty.S };
    default:
      return getDefaultSettings(Difficulty.C);
  }
};

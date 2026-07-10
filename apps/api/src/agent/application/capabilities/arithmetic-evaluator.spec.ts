import { evaluateArithmetic } from './arithmetic-evaluator';

describe('evaluateArithmetic', () => {
  const cases: readonly [string, string][] = [
    ['2 + 2', '4'],
    ['What is 2 + 2?', '4'],
    ["What's 12 * (3 + 4)?", '84'],
    ['Calculate 100 / 5', '20'],
    ['Compute 2 ^ 10', '1024'],
    ['7 × 6', '42'],
    ['81 ÷ 9', '9'],
    ['1.5 + 2.25', '3.75'],
    ['10 - 4', '6'],
    ['-3 + 5', '2'],
    ['2 ^ 3 ^ 2', '512'],
    ['(1 + 2) * (3 + 4)', '21'],
    ['0.1 + 0.2', '0.3'],
    ['What is 15% of 80?', '12'],
    ['Evaluate 2.5 % of 200', '5'],
    ['Please calculate 6 * 7.', '42'],
  ];

  for (const [input, expected] of cases) {
    it(`evaluates "${input}" to "${expected}"`, () => {
      expect(evaluateArithmetic(input)).toBe(expected);
    });
  }

  const rejected: readonly string[] = [
    'Solve for x: 2x + 3 = 7',
    'Calculate the total cost of 3 items at 4.50 each',
    'What is the square root of 144?',
    'Find the average of 4, 8, and 15',
    'What is the capital of France?',
    '10 / 0',
    '2 +',
    '(1 + 2',
    '1 + 2)',
    '',
    '   ',
    'What is?',
  ];

  for (const input of rejected) {
    it(`returns undefined for "${input}"`, () => {
      expect(evaluateArithmetic(input)).toBeUndefined();
    });
  }
});

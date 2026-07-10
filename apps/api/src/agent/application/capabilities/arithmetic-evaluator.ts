const LEADING_PHRASE =
  /^(?:please\s+)?(?:what\s+is|what's|calculate|compute|evaluate|solve|find)\b[:\s]*/i;

const PERCENT_OF = /^(\d+(?:\.\d+)?)\s*%\s*of\s+(\d+(?:\.\d+)?)$/i;

const EXPRESSION_CHARSET = /^[\d\s+\-*/().^]+$/;

/**
 * Deterministically evaluates a plain arithmetic task ("What is 12 * (3 + 4)?",
 * "15% of 80") without an LLM call. Returns undefined for anything that is not
 * a pure arithmetic expression, so callers can fall back to the LLM.
 */
export function evaluateArithmetic(input: string): string | undefined {
  const expression = normalize(input);
  if (!expression) {
    return undefined;
  }

  const percent = PERCENT_OF.exec(expression);
  if (percent) {
    return formatNumber((Number(percent[1]) / 100) * Number(percent[2]));
  }

  if (!EXPRESSION_CHARSET.test(expression)) {
    return undefined;
  }
  const value = new ExpressionParser(expression).parse();
  if (value === undefined || !Number.isFinite(value)) {
    return undefined;
  }
  return formatNumber(value);
}

function normalize(input: string): string | undefined {
  const stripped = input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .trim()
    .replace(LEADING_PHRASE, '')
    .replace(/[?!.\s]+$/, '')
    .trim();
  return stripped.length > 0 ? stripped : undefined;
}

function formatNumber(value: number): string {
  return String(Number(value.toPrecision(12)));
}

/** Recursive-descent parser for + - * / ^ ( ) with decimals and unary minus. */
class ExpressionParser {
  private position = 0;

  constructor(private readonly text: string) {}

  parse(): number | undefined {
    const value = this.additive();
    this.skipWhitespace();
    if (value === undefined || this.position < this.text.length) {
      return undefined;
    }
    return value;
  }

  private additive(): number | undefined {
    let left = this.multiplicative();
    while (left !== undefined) {
      const operator = this.consumeOperator('+', '-');
      if (!operator) {
        return left;
      }
      const right = this.multiplicative();
      if (right === undefined) {
        return undefined;
      }
      left = operator === '+' ? left + right : left - right;
    }
    return left;
  }

  private multiplicative(): number | undefined {
    let left = this.exponent();
    while (left !== undefined) {
      const operator = this.consumeOperator('*', '/');
      if (!operator) {
        return left;
      }
      const right = this.exponent();
      if (right === undefined) {
        return undefined;
      }
      left = operator === '*' ? left * right : left / right;
    }
    return left;
  }

  private exponent(): number | undefined {
    const base = this.unary();
    if (base === undefined || !this.consumeOperator('^')) {
      return base;
    }
    const power = this.exponent();
    return power === undefined ? undefined : base ** power;
  }

  private unary(): number | undefined {
    if (this.consumeOperator('-')) {
      const value = this.unary();
      return value === undefined ? undefined : -value;
    }
    return this.primary();
  }

  private primary(): number | undefined {
    this.skipWhitespace();
    if (this.text[this.position] === '(') {
      this.position += 1;
      const value = this.additive();
      this.skipWhitespace();
      if (value === undefined || this.text[this.position] !== ')') {
        return undefined;
      }
      this.position += 1;
      return value;
    }
    return this.number();
  }

  private number(): number | undefined {
    const match = /^\d+(?:\.\d+)?/.exec(this.text.slice(this.position));
    if (!match) {
      return undefined;
    }
    this.position += match[0].length;
    return Number(match[0]);
  }

  private consumeOperator(...operators: readonly string[]): string | undefined {
    this.skipWhitespace();
    const character = this.text[this.position];
    if (character !== undefined && operators.includes(character)) {
      this.position += 1;
      return character;
    }
    return undefined;
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.text[this.position] ?? '')) {
      this.position += 1;
    }
  }
}

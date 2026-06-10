import type { Expr, Token } from "./types";

/**
 * Pratt-style recursive-descent parser.
 *
 * Precedence (low → high):
 *   1. comparison: == != < <= > >=
 *   2. additive:   + - &
 *   3. multiplicative: * /
 *   4. unary: -
 *   5. primary: number | string | field | call | parens
 */
export function parse(tokens: Token[]): Expr {
  const p = new Parser(tokens);
  const expr = p.parseExpression();
  if (p.peek().kind !== "eof") throw new SyntaxError("Unexpected trailing tokens");
  return expr;
}

class Parser {
  private i = 0;
  constructor(private readonly tokens: Token[]) {}

  peek(): Token {
    return this.tokens[this.i] ?? { kind: "eof" };
  }
  next(): Token {
    return this.tokens[this.i++] ?? { kind: "eof" };
  }

  parseExpression(): Expr {
    return this.parseComparison();
  }

  parseComparison(): Expr {
    let left = this.parseAdditive();
    while (true) {
      const t = this.peek();
      if (
        t.kind === "op" &&
        (t.value === "==" ||
          t.value === "=" ||
          t.value === "!=" ||
          t.value === "<" ||
          t.value === "<=" ||
          t.value === ">" ||
          t.value === ">=")
      ) {
        this.next();
        const right = this.parseAdditive();
        // Normalize "=" to "==" so the evaluator only branches on one form.
        left = { kind: "binary", op: t.value === "=" ? "==" : t.value, left, right };
      } else {
        return left;
      }
    }
  }

  parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (true) {
      const t = this.peek();
      if (t.kind === "op" && (t.value === "+" || t.value === "-" || t.value === "&")) {
        this.next();
        const right = this.parseMultiplicative();
        left = { kind: "binary", op: t.value, left, right };
      } else {
        return left;
      }
    }
  }

  parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (true) {
      const t = this.peek();
      if (t.kind === "op" && (t.value === "*" || t.value === "/")) {
        this.next();
        const right = this.parseUnary();
        left = { kind: "binary", op: t.value, left, right };
      } else {
        return left;
      }
    }
  }

  parseUnary(): Expr {
    const t = this.peek();
    if (t.kind === "op" && t.value === "-") {
      this.next();
      const operand = this.parseUnary();
      return { kind: "unary", op: "-", operand };
    }
    return this.parsePrimary();
  }

  parsePrimary(): Expr {
    const t = this.next();
    if (t.kind === "number") return { kind: "literal", value: { type: "number", value: t.value } };
    if (t.kind === "string") return { kind: "literal", value: { type: "text", value: t.value } };
    if (t.kind === "field") return { kind: "field", name: t.value };
    if (t.kind === "ident") {
      // Boolean / null literals (case-insensitive)
      const upper = t.value.toUpperCase();
      if (upper === "TRUE") return { kind: "literal", value: { type: "boolean", value: true } };
      if (upper === "FALSE") return { kind: "literal", value: { type: "boolean", value: false } };
      if (upper === "NULL" || upper === "BLANK") return { kind: "literal", value: { type: "null" } };
      // Function call
      if (this.peek().kind !== "lparen") {
        throw new SyntaxError(`Expected '(' after function name '${t.value}'`);
      }
      this.next(); // consume lparen
      const args: Expr[] = [];
      if (this.peek().kind !== "rparen") {
        args.push(this.parseExpression());
        while (this.peek().kind === "comma") {
          this.next();
          args.push(this.parseExpression());
        }
      }
      if (this.peek().kind !== "rparen") throw new SyntaxError("Expected ')'");
      this.next();
      return { kind: "call", name: upper, args };
    }
    if (t.kind === "lparen") {
      const inner = this.parseExpression();
      if (this.peek().kind !== "rparen") throw new SyntaxError("Expected ')'");
      this.next();
      return inner;
    }
    throw new SyntaxError(`Unexpected token: ${t.kind === "op" ? t.value : t.kind}`);
  }
}

/**
 * Formula engine — Phase 7.1 of the SmartSuite parity roadmap.
 *
 * Public API:
 *   compile(source) → Expr             // throws SyntaxError on bad input
 *   evaluate(expr, ctx) → Value        // never throws — errors are Values
 *   run(source, ctx) → Value           // compile + evaluate one-shot, with
 *                                       // SyntaxError → error Value coercion
 *
 * Function library (v1):
 *   Logical:      IF, AND, OR, NOT, IFERROR
 *   Numeric:      ROUND, ABS
 *   Text:         CONCAT, LEN/LENGTH, UPPER, LOWER, TRIM, CONTAINS
 *   Date:         TODAY, NOW, DATEDIFF, DATEADD
 *   Aggregate:    SUM, AVG, COUNT, MIN, MAX (and *IF variants)
 *   System:       BLANK, ISBLANK, IS_NOT_NULL
 *
 * Operators: + - * / & == != = < <= > >=  (parens, unary minus)
 *
 * Field references: [Field Name]
 */

export { tokenize } from "./tokenize";
export { parse } from "./parse";
export { evaluate } from "./evaluate";
export type { Value, Expr, Token, EvalContext } from "./types";

import { tokenize } from "./tokenize";
import { parse } from "./parse";
import { evaluate } from "./evaluate";
import type { EvalContext, Expr, Value } from "./types";

/** Compile a formula source string into an AST. Throws SyntaxError on invalid syntax. */
export function compile(source: string): Expr {
  return parse(tokenize(source));
}

/** Compile + evaluate in one call. Syntax errors become Value("error"). */
export function run(source: string, ctx: EvalContext): Value {
  try {
    return evaluate(parse(tokenize(source)), ctx);
  } catch (e) {
    return { type: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

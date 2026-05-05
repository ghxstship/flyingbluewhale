/**
 * Formula engine — Phase 7.1 of the SmartSuite parity roadmap.
 *
 * Per https://help.smartsuite.com/en/articles/8686451-formula-functions-operators
 * SmartSuite ships ~80 formula functions. This v1 covers the 12 most commonly
 * referenced — enough to express deliverable progress, project completion %,
 * payment-app % billed, due-date math, and currency rollups (the patterns
 * scattered across the LYTEHAUS code today).
 *
 * Design:
 *   - Pure-logic parser + evaluator (no DB, no async, no IO)
 *   - Tokenizer → recursive-descent parser → tagged-union AST → tree-walking
 *     evaluator with strict typing (Number | Text | Date | Boolean | Null)
 *   - Function args validated by arity + per-arg type tag
 *   - Field references resolved against a flat `fields: Record<string, Value>`
 *     ctx — caller pre-resolves any nested or linked-record paths before eval
 *   - Errors return a Value of type "error" with a message — no exceptions
 *     escape `evaluate()` (so a single bad cell never breaks a row)
 *
 * Restrictions (matching SmartSuite semantics):
 *   - IF/CASE branches must return same type
 *   - Operators are typed: `+` works on Number+Number AND Text+Text
 *   - Date comparisons coerce ISO strings via Date.parse; mixed-type compare
 *     short-circuits to error
 */

export type Value =
  | { type: "number"; value: number }
  | { type: "text"; value: string }
  | { type: "date"; value: Date }
  | { type: "boolean"; value: boolean }
  | { type: "null" }
  | { type: "error"; message: string };

export type Token =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "ident"; value: string }
  | { kind: "field"; value: string } // [Field Name]
  | { kind: "op"; value: string } // + - * / = == != < <= > >=
  | { kind: "lparen" }
  | { kind: "rparen" }
  | { kind: "comma" }
  | { kind: "eof" };

export type Expr =
  | { kind: "literal"; value: Value }
  | { kind: "field"; name: string }
  | { kind: "binary"; op: string; left: Expr; right: Expr }
  | { kind: "unary"; op: string; operand: Expr }
  | { kind: "call"; name: string; args: Expr[] };

export type EvalContext = {
  /** Field name → resolved value. Caller is responsible for resolving linked-record paths. */
  fields: Record<string, Value>;
  /** Current time. Defaults to a fresh Date() per call but can be pinned for tests. */
  now?: Date;
};

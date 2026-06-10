import type { Token } from "./types";

/**
 * Tokenizer for the formula language.
 *
 * Grammar:
 *   number   ::= [0-9]+ ("." [0-9]+)?
 *   string   ::= "..."  (escape: \\ \" \n)
 *   ident    ::= [A-Za-z_][A-Za-z0-9_]*
 *   field    ::= "[" any-but-bracket "]"
 *   op       ::= "+" "-" "*" "/" "=" "==" "!=" "<" "<=" ">" ">="
 *
 * Whitespace is skipped. `#` starts a line comment.
 */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = source.length;

  while (i < n) {
    const c = source[i]!;

    // whitespace
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }

    // comments
    if (c === "#") {
      while (i < n && source[i] !== "\n") i++;
      continue;
    }

    // string literal
    if (c === '"') {
      let j = i + 1;
      let v = "";
      while (j < n && source[j] !== '"') {
        if (source[j] === "\\" && j + 1 < n) {
          const next = source[j + 1];
          v += next === "n" ? "\n" : next === "t" ? "\t" : next;
          j += 2;
        } else {
          v += source[j];
          j++;
        }
      }
      if (j >= n) throw new SyntaxError("Unterminated string literal");
      tokens.push({ kind: "string", value: v });
      i = j + 1;
      continue;
    }

    // field reference [Field Name]
    if (c === "[") {
      let j = i + 1;
      let name = "";
      while (j < n && source[j] !== "]") {
        name += source[j];
        j++;
      }
      if (j >= n) throw new SyntaxError("Unterminated field reference");
      const trimmed = name.trim();
      if (!trimmed) throw new SyntaxError("Empty field reference");
      tokens.push({ kind: "field", value: trimmed });
      i = j + 1;
      continue;
    }

    // number
    if ((c >= "0" && c <= "9") || (c === "." && i + 1 < n && source[i + 1]! >= "0" && source[i + 1]! <= "9")) {
      let j = i;
      let saw_dot = false;
      while (j < n) {
        const cc = source[j]!;
        if (cc >= "0" && cc <= "9") {
          j++;
        } else if (cc === "." && !saw_dot) {
          saw_dot = true;
          j++;
        } else {
          break;
        }
      }
      const num = parseFloat(source.slice(i, j));
      if (!Number.isFinite(num)) throw new SyntaxError(`Invalid number: ${source.slice(i, j)}`);
      tokens.push({ kind: "number", value: num });
      i = j;
      continue;
    }

    // identifier
    if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_") {
      let j = i;
      while (j < n) {
        const cc = source[j]!;
        if ((cc >= "a" && cc <= "z") || (cc >= "A" && cc <= "Z") || (cc >= "0" && cc <= "9") || cc === "_") {
          j++;
        } else {
          break;
        }
      }
      tokens.push({ kind: "ident", value: source.slice(i, j) });
      i = j;
      continue;
    }

    // structural
    if (c === "(") {
      tokens.push({ kind: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ kind: "rparen" });
      i++;
      continue;
    }
    if (c === ",") {
      tokens.push({ kind: "comma" });
      i++;
      continue;
    }

    // operators
    if (c === "=" || c === "!" || c === "<" || c === ">") {
      const next = i + 1 < n ? source[i + 1] : "";
      if (next === "=") {
        tokens.push({ kind: "op", value: c + "=" });
        i += 2;
        continue;
      }
      tokens.push({ kind: "op", value: c });
      i++;
      continue;
    }
    if (c === "+" || c === "-" || c === "*" || c === "/") {
      tokens.push({ kind: "op", value: c });
      i++;
      continue;
    }
    if (c === "&") {
      // Optional concat operator; map to + for strings
      tokens.push({ kind: "op", value: "&" });
      i++;
      continue;
    }

    throw new SyntaxError(`Unexpected character: ${c} at ${i}`);
  }

  tokens.push({ kind: "eof" });
  return tokens;
}

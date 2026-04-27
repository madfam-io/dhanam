/**
 * Strip trailing slashes from a URL without using a regex.
 *
 * The regex `/\/+$/` is flagged as polynomial-redos because `+` over `/`
 * triggers backtracking on adversarial inputs like `"////…/X"`. A linear
 * scan from the right is O(n) regardless of input shape.
 */
export function stripTrailingSlashes(input: string): string {
  let end = input.length;
  while (end > 0 && input.charCodeAt(end - 1) === 47 /* '/' */) {
    end--;
  }
  return end === input.length ? input : input.slice(0, end);
}

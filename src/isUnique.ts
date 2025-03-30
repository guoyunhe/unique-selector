/**
 * Checks if the selector is unique
 * @param  { Object } element
 * @param  { String } selector
 * @return { Array }
 */
export function isUnique(el, selector) {
  if (!selector) return false;
  try {
    const elems = el.ownerDocument.querySelectorAll(selector);
    return elems.length === 1 && elems[0] === el;
  } catch {
    return false;
  }
}

/**
 * Expose `unique`
 */

import { getAttributeSelector } from './getAttribute';
import { getAttributes } from './getAttributes';
import { getClassSelectors } from './getClasses';
import { getCombinations } from './getCombinations';
import { getID } from './getID';
import { getName } from './getName';
import { getNthChild } from './getNthChild';
import { getTag } from './getTag';
import { isUnique } from './isUnique';

const dataRegex = /^data-.+/;
const attrRegex = /^attribute:(.+)/m;

/**
 * Returns all the selectors of the element
 */
function getAllSelectors(el: Element, selectors, attributesToIgnore, filter): object {
  const consolidatedAttributesToIgnore = [...attributesToIgnore];
  const nonAttributeSelectors = [];
  for (const selectorType of selectors) {
    if (dataRegex.test(selectorType)) {
      consolidatedAttributesToIgnore.push(selectorType);
    } else if (attrRegex.test(selectorType)) {
      consolidatedAttributesToIgnore.push(selectorType.replace(attrRegex, '$1'));
    } else {
      nonAttributeSelectors.push(selectorType);
    }
  }

  const funcs = {
    tag: (elem) => getTag(elem, filter),
    'nth-child': (elem) => getNthChild(elem, filter),
    attributes: (elem) => getAttributes(elem, consolidatedAttributesToIgnore, filter),
    class: (elem) => getClassSelectors(elem, filter),
    id: (elem) => getID(elem, filter),
    name: (elem) => getName(elem, filter),
  };

  return nonAttributeSelectors.reduce((res, next) => {
    res[next] = funcs[next](el);
    return res;
  }, {});
}

/**
 * Tests uniqueNess of the element inside its parent
 */
function testUniqueness(element: Element, selector: string): boolean {
  const { parentNode } = element;
  try {
    const elements = parentNode.querySelectorAll(selector);
    return elements.length === 1 && elements[0] === element;
  } catch {
    return false;
  }
}

/**
 * Tests all selectors for uniqueness and returns the first unique selector.
 */
function getFirstUnique(element: object, selectors: any[]): string {
  return selectors.find(testUniqueness.bind(null, element));
}

/**
 * Checks all the possible selectors of an element to find one unique and return it
 */
function getUniqueCombination(element: object, items: any[], tag: string): string {
  let combinations = getCombinations(items, 3);
  let firstUnique = getFirstUnique(element, combinations);

  if (firstUnique) {
    return firstUnique;
  }

  if (tag) {
    combinations = combinations.map((combination) => tag + combination);
    firstUnique = getFirstUnique(element, combinations);

    if (firstUnique) {
      return firstUnique;
    }
  }

  return null;
}

/**
 * Returns a uniqueSelector based on the passed options
 */
function getUniqueSelector(element: Element, selectorTypes, attributesToIgnore, filter): string {
  let foundSelector;

  const elementSelectors = getAllSelectors(element, selectorTypes, attributesToIgnore, filter);

  for (let selectorType of selectorTypes) {
    let selector = elementSelectors[selectorType];

    // if we are a data attribute
    const isDataAttributeSelectorType = dataRegex.test(selectorType);
    const isAttributeSelectorType = !isDataAttributeSelectorType && attrRegex.test(selectorType);
    if (isDataAttributeSelectorType || isAttributeSelectorType) {
      const attributeToQuery = isDataAttributeSelectorType
        ? selectorType
        : selectorType.replace(attrRegex, '$1');
      const attributeSelector = getAttributeSelector(element, attributeToQuery, filter);
      // if we found a selector via attribute
      if (attributeSelector) {
        selector = attributeSelector;
        selectorType = 'attribute';
      }
    }

    if (!selector) continue;

    switch (selectorType) {
      case 'attribute':
      case 'id':
      case 'name':
      case 'tag':
        if (testUniqueness(element, selector)) {
          return selector;
        }
        break;
      case 'class':
      case 'attributes':
        if (selector.length) {
          foundSelector = getUniqueCombination(element, selector, elementSelectors.tag);
          if (foundSelector) {
            return foundSelector;
          }
        }
        break;

      case 'nth-child':
        return selector;

      default:
        break;
    }
  }
  return '*';
}

/**
 * Generate unique CSS selector for given DOM element
 *
 * @param {Element} el
 * @param {Object} options (optional) Customize various behaviors of selector generation
 * @param {String[]} options.selectorTypes Specify the set of traits to leverage when building selectors in precedence order
 * @param {String[]} options.attributesToIgnore Specify a set of attributes to *not* leverage when building selectors
 * @param {Filter} options.filter Provide a filter function to conditionally reject various traits when building selectors.
 * @param {Map<Element, String>} options.selectorCache Provide a cache to improve performance of repeated selector generation - it is the responsibility of the caller to handle cache invalidation. Caching is performed using the input Element as key. This cache handles Element -> Selector caching.
 * @param {Map<String, Boolean>} options.isUniqueCache Provide a cache to improve performance of repeated selector generation - it is the responsibility of the caller to handle cache invalidation. Caching is performed using the input Element as key. This cache handles Selector -> isUnique caching.
 * @return {String}
 * @api private
 */
export default function unique(
  el: Element,
  options: {
    selectorTypes?: string[];
    attributesToIgnore?: string[];
    filter?: (type: string, key: string, value: string) => boolean;
    selectorCache?: Map<Element, string>;
    isUniqueCache?: Map<string, boolean>;
  } = {},
): string | null {
  const {
    selectorTypes = ['id', 'name', 'class', 'tag', 'nth-child'],
    attributesToIgnore = ['id', 'class', 'length'],
    filter,
    selectorCache,
    isUniqueCache,
  } = options;
  // If filter was provided wrap it to ensure a default value of `true` is returned if the provided function fails to return a value
  const normalizedFilter =
    filter &&
    function (type, key, value) {
      const result = filter(type, key, value);
      if (result === null || result === undefined) {
        return true;
      }
      return result;
    };
  const allSelectors = [];

  let currentElement = el;
  while (currentElement) {
    let selector = selectorCache ? selectorCache.get(currentElement) : undefined;

    if (!selector) {
      selector = getUniqueSelector(
        currentElement,
        selectorTypes,
        attributesToIgnore,
        normalizedFilter,
      );
      if (selectorCache) {
        selectorCache.set(currentElement, selector);
      }
    }

    allSelectors.unshift(selector);
    const maybeUniqueSelector = allSelectors.join(' > ');
    let isUniqueSelector = isUniqueCache ? isUniqueCache.get(maybeUniqueSelector) : undefined;
    if (isUniqueSelector === undefined) {
      isUniqueSelector = isUnique(el, maybeUniqueSelector);
      if (isUniqueCache) {
        isUniqueCache.set(maybeUniqueSelector, isUniqueSelector);
      }
    }

    if (isUniqueSelector) {
      return maybeUniqueSelector;
    }

    currentElement = currentElement.parentNode as Element;
  }

  return null;
}

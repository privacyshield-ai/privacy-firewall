// ============================================================================
// DOM UTILITY FUNCTIONS
// ============================================================================

import { Logger } from './utils.js';

/**
 * Gets text content from various types of elements
 * @param {HTMLElement} element - The element to extract text from
 * @returns {string} The extracted text
 */
export function getTextFromElement(element) {
  if (!element) return '';
  
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    return element.value || '';
  }
  
  if (element.isContentEditable) {
    return element.textContent || element.innerText || '';
  }
  
  return '';
}

/**
 * Creates a context object capturing the current insertion point
 * @param {Event} e - The event object (usually paste event)
 * @returns {Object|null} Insertion context with type, node, and position info
 */
export function captureInsertionContext(e) {
  const target = e?.target;
  if (!target) return null;
  
  if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
    return {
      type: "input",
      node: target,
      start: target.selectionStart || 0,
      end: target.selectionEnd || 0
    };
  }
  
  if (target.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return {
        type: "contentEditable",
        node: target,
        range: selection.getRangeAt(0).cloneRange()
      };
    }
  }
  
  return null;
}

/**
 * Inserts text into an input or textarea element
 * @param {HTMLInputElement|HTMLTextAreaElement} input - The input element
 * @param {string} text - Text to insert
 * @param {number} start - Start position
 * @param {number} end - End position
 */
function insertIntoInputElement(input, text, start, end) {
  try {
    input.focus();
    const value = input.value || "";
    input.value = value.substring(0, start) + text + value.substring(end);
    const newPosition = start + text.length;
    input.selectionStart = newPosition;
    input.selectionEnd = newPosition;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  } catch (error) {
    Logger.error('Failed to insert text into input element:', error);
  }
}

/**
 * Inserts text into a contentEditable element
 * @param {HTMLElement} element - The contentEditable element
 * @param {string} text - Text to insert
 * @param {Range} range - The range to insert at
 */
function insertIntoContentEditable(element, text, range) {
  try {
    element.focus();
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    
    // Move cursor after inserted text
    const selection = window.getSelection();
    selection.collapseToEnd();
    
    element.dispatchEvent(new Event("input", { bubbles: true }));
  } catch (error) {
    Logger.error('Failed to insert text into contentEditable:', error);
  }
}

/**
 * Removes text from an element based on insertion context
 * Used when AI scan detects sensitive data after paste has already occurred
 * @param {string} text - Text to remove
 * @param {Object|null} context - Insertion context from captureInsertionContext
 */
export function removeTextFromElement(text, context = null) {
  if (!text || !context) {
    Logger.warn('Cannot remove text: missing text or context');
    return;
  }

  try {
    if (context.type === "input" && context.node?.isConnected) {
      const input = context.node;
      const currentValue = input.value || "";
      const start = context.start ?? 0;
      
      // Find where the text was inserted and remove it
      const insertedAt = currentValue.indexOf(text, start);
      if (insertedAt !== -1) {
        input.focus();
        input.value = currentValue.substring(0, insertedAt) + currentValue.substring(insertedAt + text.length);
        input.selectionStart = insertedAt;
        input.selectionEnd = insertedAt;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        Logger.info('Removed pasted text from input element');
      }
      return;
    }

    if (context.type === "contentEditable" && context.node?.isConnected) {
      const element = context.node;
      element.focus();
      
      // Get current content and remove the pasted text
      const currentContent = element.textContent || element.innerText || "";
      const insertedAt = currentContent.indexOf(text);
      
      if (insertedAt !== -1) {
        // Use Selection API to select and delete the text
        const textContent = element.textContent;
        const before = textContent.substring(0, insertedAt);
        const after = textContent.substring(insertedAt + text.length);
        
        // Clear and reset content (works for most contentEditable)
        element.textContent = before + after;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        Logger.info('Removed pasted text from contentEditable element');
      }
      return;
    }
  } catch (error) {
    Logger.error('Failed to remove text:', error);
  }
}

/**
 * Inserts text at the cursor position using modern APIs
 * @param {string} text - Text to insert
 * @param {Object|null} context - Insertion context from captureInsertionContext
 */
export function insertTextAtCursor(text, context = null) {
  // Try to use provided context first
  if (context?.type === "input" && context.node?.isConnected) {
    const input = context.node;
    const start = context.start ?? input.selectionStart ?? 0;
    const end = context.end ?? input.selectionEnd ?? start;
    insertIntoInputElement(input, text, start, end);
    return;
  }

  if (context?.type === "contentEditable" && context.node?.isConnected && context.range) {
    const range = context.range.cloneRange();
    insertIntoContentEditable(context.node, text, range);
    return;
  }

  // Fall back to active element
  const activeElement = document.activeElement;
  if (!activeElement) {
    Logger.warn('No active element to insert text into');
    return;
  }

  if (activeElement.tagName === "TEXTAREA" || activeElement.tagName === "INPUT") {
    const start = activeElement.selectionStart || 0;
    const end = activeElement.selectionEnd || 0;
    insertIntoInputElement(activeElement, text, start, end);
  } else if (activeElement.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      insertIntoContentEditable(activeElement, text, range);
    }
  } else {
    Logger.warn('Active element is not editable');
  }
}

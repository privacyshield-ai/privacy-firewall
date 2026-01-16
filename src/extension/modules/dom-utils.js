// ============================================================================
// DOM UTILITY FUNCTIONS
// ============================================================================

import { Logger } from './utils.js';

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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
      end: target.selectionEnd || 0,
      previousContent: target.value || ''  // Store content before paste
    };
  }
  
  if (target.isContentEditable) {
    const selection = window.getSelection();
    return {
      type: "contentEditable",
      node: target,
      range: selection?.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null,
      previousContent: target.innerHTML || ''  // Store content before paste
    };
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
  // If we have previousContent from context, use that for restoration
  if (context?.previousContent !== undefined) {
    return restoreFromContext(context);
  }
  
  // Fallback: find element and try to clear/undo
  let element = document.activeElement;
  
  if (!element || element === document.body) {
    element = document.querySelector('.ql-editor[contenteditable="true"]') ||  // Quill (Gemini)
              document.querySelector('.ProseMirror[contenteditable="true"]') || // ProseMirror (ChatGPT)
              document.querySelector('[contenteditable="true"]') ||
              document.querySelector('textarea:focus, input:focus');
  }
  
  if (!element) {
    Logger.warn('Cannot remove text: no editable element found');
    return;
  }
  
  // Clear the element as last resort
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (element.isContentEditable) {
    element.innerHTML = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  Logger.info('Cleared element content (no previous content available)');
}

/**
 * Restores element content from saved context
 * @param {Object} context - Context with previousContent
 */
function restoreFromContext(context) {
  // Find the current element - original may be disconnected (React/Angular replace nodes)
  let element = context.node?.isConnected ? context.node : null;
  
  if (!element) {
    // Find by type - editors often recreate elements
    if (context.type === 'input') {
      element = document.activeElement;
      if (element?.tagName !== 'TEXTAREA' && element?.tagName !== 'INPUT') {
        element = document.querySelector('textarea, input[type="text"]');
      }
    } else {
      element = document.activeElement;
      if (!element?.isContentEditable) {
        element = document.querySelector('.ql-editor[contenteditable="true"]') ||
                  document.querySelector('.ProseMirror[contenteditable="true"]') ||
                  document.querySelector('[contenteditable="true"]');
      }
    }
  }
  
  if (!element) {
    Logger.warn('Cannot restore: element not found');
    return;
  }
  
  try {
    element.focus();
    
    if (context.type === 'input') {
      element.value = context.previousContent;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      element.innerHTML = context.previousContent;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    Logger.info('Restored previous content successfully');
  } catch (error) {
    Logger.error('Failed to restore content:', error);
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

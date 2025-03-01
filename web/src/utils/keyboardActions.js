/**
 * Handles global keydown events for dialogs.
 * @param {KeyboardEvent} e - The keydown event object.
 * @param {Object} actions - An object containing callbacks mapped to keys.
 * @param {Object.<string, Function>} actions.callbacks - A map of key names to callback functions.
 */
export function handleKeyDown(e, { callbacks }) {
  const callback = callbacks[e.key]; // Match the key pressed
  if (callback && typeof callback === "function") {
    callback(); // Execute the corresponding callback
  }
}

// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Activation keys offered by the preference combo rows.
 * A value is a "+"-joined list of modifiers; every one of them must be
 * held for the activation to trigger.
 */
export const ACTIVATION_KEYS = [
  { name: "Left Shift", value: "Shift_L" },
  { name: "Right Shift", value: "Shift_R" },
  { name: "Left Ctrl", value: "Control_L" },
  { name: "Right Ctrl", value: "Control_R" },
  { name: "Left Alt", value: "Alt_L" },
  { name: "Right Alt", value: "Alt_R" },
  { name: "Left Super", value: "Super_L" },
  { name: "Right Super", value: "Super_R" },
  { name: "Left Ctrl + Left Alt", value: "Control_L+Alt_L" },
  { name: "Left Ctrl + Left Alt + Super", value: "Control_L+Alt_L+Super_L" },
];

/**
 * True if the setting value describes a multi-modifier combination.
 * @param {string} keyString
 */
export function isCombination(keyString) {
  return (keyString || "").includes("+");
}

// SPDX-License-Identifier: GPL-3.0-or-later

import Clutter from "gi://Clutter";

// modifier name -> accepted masks. A modifier counts as held when *any* of its
// bits is set: Super is reported as MOD4_MASK by global.get_pointer(), while
// SUPER_MASK is a virtual modifier that is not set on every backend.
const MODIFIER_MASKS = [
  ["Shift", Clutter.ModifierType.SHIFT_MASK],
  ["Control", Clutter.ModifierType.CONTROL_MASK],
  ["Alt", Clutter.ModifierType.MOD1_MASK],
  ["Super", Clutter.ModifierType.MOD4_MASK | Clutter.ModifierType.SUPER_MASK],
];

/**
 * Resolves an activation setting into the list of modifiers it requires.
 * Combinations are "+"-joined, e.g. 'Control_L+Alt_L+Super_L'.
 *
 * Note the _L/_R suffixes are cosmetic: Clutter's modifier mask has no
 * left/right bits, so 'Control_L' and 'Control_R' resolve identically.
 * @param {string} keyString - value from magnifier-key / spotlight-key
 * @returns {number[]} - one mask per required modifier, empty when unrecognised
 */
export function getActivationMasks(keyString) {
  const masks = [];

  for (const part of (keyString || "").split("+")) {
    const entry = MODIFIER_MASKS.find(([name]) => part.includes(name));
    if (entry && !masks.includes(entry[1])) masks.push(entry[1]);
  }

  return masks;
}

/**
 * True when every modifier required by the activation is currently held.
 * Extra modifiers are ignored, so a 3-key combo also satisfies its 2-key prefix.
 * @param {number} mask - live modifier mask from global.get_pointer()
 * @param {number[]} requiredMasks - masks from getActivationMasks()
 */
export function isActivationHeld(mask, requiredMasks) {
  return (
    requiredMasks.length > 0 && requiredMasks.every((m) => (mask & m) !== 0)
  );
}

/**
 * Maps a shape name string to a shader float value
 * @param {string} shapeString - 'circle', 'squircle', 'square'
 * @returns {number} - 0.0, 1.0, or 2.0
 */
export function getShapeValue(shapeString) {
  switch (shapeString) {
    case "circle":
      return 0.0;
    case "squircle":
      return 1.0;
    case "square":
      return 2.0;
    default:
      return 0.0;
  }
}
/**
 * Parses a CSS-like rgba string into a Clutter/Cairo compatible object
 * @param {string} colorString - e.g. "rgba(255, 255, 255, 1.0)"
 * @returns {Object} - { red, green, blue, alpha }
 */
export function parseColor(colorString) {
  const match = colorString.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
  );

  if (match) {
    return {
      red: parseInt(match[1]),
      green: parseInt(match[2]),
      blue: parseInt(match[3]),
      alpha: match[4] ? parseFloat(match[4]) : 1.0,
    };
  }

  return { red: 99, green: 162, blue: 255, alpha: 0.7 };
}

/**
 * Converts HSL color values to RGB object
 * @param {number} h - Hue (0.0 to 360.0)
 * @param {number} s - Saturation (0.0 to 1.0)
 * @param {number} l - Lightness (0.0 to 1.0)
 * @returns {Object} - { red, green, blue, alpha: 1.0 }
 */
export function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    red: Math.round((r + m) * 255),
    green: Math.round((g + m) * 255),
    blue: Math.round((b + m) * 255),
    alpha: 1.0,
  };
}

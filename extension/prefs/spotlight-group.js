// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import Gio from "gi://Gio";

import { ACTIVATION_KEYS } from "../activation-keys.js";

const SPOTLIGHT_EASING_STYLES = [
  { name: "Ease In", value: "ease-in" },
  { name: "Ease Out", value: "ease-out" },
  { name: "Ease In and Out", value: "ease-in-out" },
];

export function buildSpotlightGroup(settings) {
  const group = new Adw.PreferencesGroup({
    title: "Spotlight",
  });

  const enabledRow = new Adw.SwitchRow({
    title: "Enable Spotlight",
    subtitle: "Darken screen and show hole around cursor",
  });
  settings.bind(
    "spotlight-enabled",
    enabledRow,
    "active",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(enabledRow);

  const activationKeyModel = new Gtk.StringList();
  ACTIVATION_KEYS.forEach((k) => activationKeyModel.append(k.name));

  const activationKeyRow = new Adw.ComboRow({
    title: "Activation Key",
    subtitle: "Key to hold",
    model: activationKeyModel,
  });

  const currentKey = settings.get_string("spotlight-key");
  const keyIndex = ACTIVATION_KEYS.findIndex((k) => k.value === currentKey);
  activationKeyRow.set_selected(keyIndex >= 0 ? keyIndex : 0);

  activationKeyRow.connect("notify::selected", () => {
    const idx = activationKeyRow.get_selected();
    if (idx < ACTIVATION_KEYS.length) {
      settings.set_string("spotlight-key", ACTIVATION_KEYS[idx].value);
    }
  });
  settings.bind(
    "spotlight-enabled",
    activationKeyRow,
    "sensitive",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(activationKeyRow);

  const opacityRow = new Adw.SpinRow({
    title: "End Opacity",
    subtitle: "Darkness of the background once the spotlight has settled",
    digits: 2,
    adjustment: new Gtk.Adjustment({
      lower: 0.1,
      upper: 1.0,
      step_increment: 0.05,
      page_increment: 0.1,
      value: settings.get_double("spotlight-opacity"),
    }),
  });
  settings.bind(
    "spotlight-opacity",
    opacityRow,
    "value",
    Gio.SettingsBindFlags.DEFAULT,
  );
  settings.bind(
    "spotlight-enabled",
    opacityRow,
    "sensitive",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(opacityRow);

  const sizeRow = new Adw.SpinRow({
    title: "Spotlight Size",
    subtitle: "Diameter of the light circle",
    digits: 0,
    adjustment: new Gtk.Adjustment({
      lower: 50,
      upper: 500,
      step_increment: 10,
      page_increment: 50,
      value: settings.get_int("spotlight-size"),
    }),
  });
  settings.bind(
    "spotlight-size",
    sizeRow,
    "value",
    Gio.SettingsBindFlags.DEFAULT,
  );
  settings.bind(
    "spotlight-enabled",
    sizeRow,
    "sensitive",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(sizeRow);

  return group;
}

/**
 * Build the Spotlight transition preferences group
 * @param {Gio.Settings} settings - Extension settings
 * @returns {Adw.PreferencesGroup}
 */
export function buildSpotlightTransitionGroup(settings) {
  const group = new Adw.PreferencesGroup({
    title: "Transition",
    description:
      "How the spotlight shrinks into place while the screen darkens",
  });

  const startSizeRow = new Adw.SpinRow({
    title: "Start Distance",
    subtitle: "Diameter of the light circle when the spotlight appears",
    digits: 0,
    adjustment: new Gtk.Adjustment({
      lower: 50,
      upper: 2000,
      step_increment: 25,
      page_increment: 100,
      value: settings.get_int("spotlight-start-size"),
    }),
  });
  settings.bind(
    "spotlight-start-size",
    startSizeRow,
    "value",
    Gio.SettingsBindFlags.DEFAULT,
  );
  settings.bind(
    "spotlight-enabled",
    startSizeRow,
    "sensitive",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(startSizeRow);

  const durationRow = new Adw.SpinRow({
    title: "Shrink Duration",
    subtitle: "Time in milliseconds to reach the final size (0 = instant)",
    digits: 0,
    adjustment: new Gtk.Adjustment({
      lower: 0,
      upper: 2000,
      step_increment: 25,
      page_increment: 100,
      value: settings.get_int("spotlight-duration"),
    }),
  });
  settings.bind(
    "spotlight-duration",
    durationRow,
    "value",
    Gio.SettingsBindFlags.DEFAULT,
  );
  settings.bind(
    "spotlight-enabled",
    durationRow,
    "sensitive",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(durationRow);

  const easingModel = new Gtk.StringList();
  SPOTLIGHT_EASING_STYLES.forEach((style) =>
    easingModel.append(style.name),
  );

  const easingRow = new Adw.ComboRow({
    title: "Easing",
    subtitle: "Acceleration style when the spotlight appears and disappears",
    model: easingModel,
  });
  const currentEasing = settings.get_string("spotlight-easing");
  const easingIndex = SPOTLIGHT_EASING_STYLES.findIndex(
    (style) => style.value === currentEasing,
  );
  easingRow.set_selected(easingIndex >= 0 ? easingIndex : 1);
  easingRow.connect("notify::selected", () => {
    const idx = easingRow.get_selected();
    if (idx < SPOTLIGHT_EASING_STYLES.length) {
      settings.set_string(
        "spotlight-easing",
        SPOTLIGHT_EASING_STYLES[idx].value,
      );
    }
  });
  settings.bind(
    "spotlight-enabled",
    easingRow,
    "sensitive",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(easingRow);

  const startOpacityRow = new Adw.SpinRow({
    title: "Start Opacity",
    subtitle: "Darkness of the background when the spotlight appears",
    digits: 2,
    adjustment: new Gtk.Adjustment({
      lower: 0.0,
      upper: 1.0,
      step_increment: 0.05,
      page_increment: 0.1,
      value: settings.get_double("spotlight-start-opacity"),
    }),
  });
  settings.bind(
    "spotlight-start-opacity",
    startOpacityRow,
    "value",
    Gio.SettingsBindFlags.DEFAULT,
  );
  settings.bind(
    "spotlight-enabled",
    startOpacityRow,
    "sensitive",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(startOpacityRow);

  return group;
}

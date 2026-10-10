// SPDX-License-Identifier: GPL-3.0-or-later

import Clutter from "gi://Clutter";
import GLib from "gi://GLib";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { Physics } from "./modules/physics.js";
import { initShaders } from "./shaders/shaders.js";
import { Magnifier } from "./modules/magnifier.js";
import Indicator from "./modules/indicator.js";
import { Spotlight } from "./modules/spotlight.js";

export default class ZoomerExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    this._settings = null;
    this._settingsChangedId = null;
    this._indicator = null;
    this._physics = null;
    this._magnifier = null;
    this._spotlight = null;
    this._tickId = 0;
    this._stageEventId = null;
  }

  async enable() {
    console.log("[Zoomer] Enabling...");

    await initShaders(this.path);

    this._settings = this.getSettings();

    // watch for settings changes
    this._settingsChangedId = this._settings.connect(
      "changed",
      (settings, key) => {
        this._onSettingsChanged(key);
      },
    );

    // indicator
    this._updateIndicator();

    // only proceed if enabled
    if (!this._settings.get_boolean("enabled")) {
      return;
    }

    this._start();

    console.log("[Zoomer] Enabled successfully");
  }

  disable() {
    console.log("[Zoomer] Disabling...");

    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }

    this._stop();

    // cleanup settings
    if (this._settings) {
      if (this._settingsChangedId) {
        this._settings.disconnect(this._settingsChangedId);
        this._settingsChangedId = null;
      }
      this._settings = null;
    }

    console.log("[Zoomer] Disabled successfully");
  }

  // add or remove the panel icon to match the show-indicator setting
  _updateIndicator() {
    const show = this._settings.get_boolean("show-indicator");

    if (show && !this._indicator) {
      this._indicator = new Indicator(this.path, this._settings, () => {
        this.openPreferences();
      });
      Main.panel.addToStatusArea("zoomer", this._indicator);
    } else if (!show && this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }

  _start() {
    if (this._physics) {
      return; // already started
    }

    this._physics = new Physics(this._settings);

    this._magnifier = new Magnifier(this._settings, this._physics);
    this._magnifier.init();

    // magnifier activation via held key
    this._stageEventId = global.stage.connect(
      "captured-event",
      (actor, event) => {
        return this._onStageEvent(event);
      },
    );

    this._spotlight = new Spotlight(this._settings);

    // cursor tracking loop feeding the magnifier and the spotlight
    this._tickId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
      this._tick();
      return GLib.SOURCE_CONTINUE;
    });
  }

  _updatePhysicsConstants() {
    if (this._physics) {
      this._physics.updateConstants();
    }
  }

  _stop() {
    if (this._tickId) {
      GLib.source_remove(this._tickId);
      this._tickId = 0;
    }

    // disconnect stage event handler
    if (this._stageEventId) {
      global.stage.disconnect(this._stageEventId);
      this._stageEventId = null;
    }

    if (this._magnifier) {
      this._magnifier.destroy();
      this._magnifier = null;
    }

    if (this._spotlight) {
      this._spotlight.destroy();
      this._spotlight = null;
    }

    if (this._physics) {
      this._physics = null;
    }
  }

  // magnifier: key event handler
  _onStageEvent(event) {
    if (this._magnifier && this._magnifier.handleKeyEvent(event)) {
      return Clutter.EVENT_STOP;
    }
    return Clutter.EVENT_PROPAGATE;
  }

  _tick() {
    if (!this._physics) return Clutter.TICK_STOP;

    const [pointerX, pointerY, mask] = global.get_pointer();

    if (this._magnifier) {
      this._magnifier.pollActivation(mask);
    }

    const [curX, curY] = this._physics.update(pointerX, pointerY);

    if (this._magnifier) {
      this._magnifier.update(curX, curY);
    }

    if (this._spotlight) {
      this._spotlight.pollActivation(mask);
      this._spotlight.update(curX, curY);
    }

    return Clutter.TICK_CONTINUE;
  }

  _toggleEnabled() {
    if (this._settings.get_boolean("enabled")) {
      this._start();
    } else {
      this._stop();
    }
  }

  _onSettingsChanged(key) {
    if (key === "show-indicator") {
      this._updateIndicator();
      return;
    }

    if (key === "enabled") {
      this._toggleEnabled();
      return;
    }

    if (
      key === "inertia-stiffness" ||
      key === "inertia-smoothness" ||
      key === "inertia-enabled"
    ) {
      this._updatePhysicsConstants();
    }
  }
}

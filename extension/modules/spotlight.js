// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from "gi://GLib";
import St from "gi://St";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import {
  getShapeValue,
  getActivationMasks,
  isActivationHeld,
} from "../utils.js";
import { SpotlightEffect } from "../shaders/spotlight-effect.js";

export class Spotlight {
  constructor(settings) {
    this._settings = settings;
    this._enabled = settings.get_boolean("spotlight-enabled");
    this._key = settings.get_string("spotlight-key");
    this._opacity = settings.get_double("spotlight-opacity");
    this._size = settings.get_int("spotlight-size");
    this._startSize = settings.get_int("spotlight-start-size");
    this._startOpacity = settings.get_double("spotlight-start-opacity");
    this._duration = settings.get_int("spotlight-duration");
    this._easing = settings.get_string("spotlight-easing");
    this._shape = getShapeValue(settings.get_string("shape"));
    this._rotation = settings.get_int("rotation");
    this._cornerRadius = settings.get_int("corner-radius");
    this._active = false;
    this._actor = null;
    this._effect = null;
    this._x = 0;
    this._y = 0;

    // transition state: progress 0.0 = start distance / start opacity,
    // 1.0 = settled at the configured size / opacity
    this._exiting = false;
    this._animFrom = 0.0;
    this._animTo = 0.0;
    this._animStart = 0;
    this._animDuration = 0;

    this._signalIds = [];

    // keep the overlay fitted when monitors change or a window goes
    // fullscreen (kept separate from settings ids: different objects)
    this._uiSignals = [];
    this._uiSignals.push([
      Main.layoutManager,
      Main.layoutManager.connect("monitors-changed", () => this.syncSize()),
    ]);
    this._uiSignals.push([
      global.display,
      global.display.connect("in-fullscreen-changed", () => this.syncSize()),
    ]);

    this._signalIds.push(
      this._settings.connect("changed::spotlight-enabled", () => {
        this._enabled = this._settings.get_boolean("spotlight-enabled");
        if (!this._enabled) this.deactivate();
      }),
    );
    this._signalIds.push(
      this._settings.connect("changed::spotlight-key", () => {
        this._key = this._settings.get_string("spotlight-key");
      }),
    );
    this._signalIds.push(
      this._settings.connect("changed::spotlight-opacity", () => {
        this._opacity = this._settings.get_double("spotlight-opacity");
        this._updateUniforms();
      }),
    );
    this._signalIds.push(
      this._settings.connect("changed::spotlight-size", () => {
        this._size = this._settings.get_int("spotlight-size");
        this._updateUniforms();
      }),
    );
    this._signalIds.push(
      this._settings.connect("changed::spotlight-start-size", () => {
        this._startSize = this._settings.get_int("spotlight-start-size");
        this._updateUniforms();
      }),
    );
    this._signalIds.push(
      this._settings.connect("changed::spotlight-start-opacity", () => {
        this._startOpacity = this._settings.get_double(
          "spotlight-start-opacity",
        );
        this._updateUniforms();
      }),
    );
    this._signalIds.push(
      this._settings.connect("changed::spotlight-duration", () => {
        this._duration = this._settings.get_int("spotlight-duration");
      }),
    );
    this._signalIds.push(
      this._settings.connect("changed::spotlight-easing", () => {
        this._easing = this._settings.get_string("spotlight-easing");
      }),
    );

    this._signalIds.push(
      this._settings.connect("changed::shape", () => {
        this._shape = getShapeValue(this._settings.get_string("shape"));
        this._updateUniforms();
      }),
    );
    this._signalIds.push(
      this._settings.connect("changed::rotation", () => {
        this._rotation = this._settings.get_int("rotation");
        this._updateUniforms();
      }),
    );
    this._signalIds.push(
      this._settings.connect("changed::corner-radius", () => {
        this._cornerRadius = this._settings.get_int("corner-radius");
        this._updateUniforms();
      }),
    );
  }

  update(x, y) {
    this._x = x;
    this._y = y;

    if (!this._actor || !this._effect) return;

    // the fade-out ran to completion, tear the overlay down
    if (this._exiting && this._progress() <= 0.0) {
      this._destroyActor();
      return;
    }

    this._updateUniforms();
  }

  /**
   * Retarget the transition, keeping a constant speed when interrupted mid-way.
   * @param {number} from - current progress
   * @param {number} to - 1.0 to settle in, 0.0 to back out
   */
  _startTransition(from, to) {
    this._animFrom = from;
    this._animTo = to;
    this._animStart = GLib.get_monotonic_time();
    // ms -> µs, shortened to the distance actually left to travel
    this._animDuration = this._duration * 1000 * Math.abs(to - from);
  }

  /**
   * Eased transition progress, 0.0 (start distance) to 1.0 (settled).
   */
  _progress() {
    if (this._animDuration <= 0) return this._animTo;

    const elapsed = GLib.get_monotonic_time() - this._animStart;
    const t = Math.min(1.0, Math.max(0.0, elapsed / this._animDuration));
    let eased;
    switch (this._easing) {
      case "ease-in":
        eased = t * t;
        break;
      case "ease-in-out":
        eased =
          t < 0.5
            ? 2.0 * t * t
            : 1.0 - Math.pow(-2.0 * t + 2.0, 2) / 2.0;
        break;
      case "ease-out":
      default:
        eased = 1.0 - (1.0 - t) * (1.0 - t);
        break;
    }

    return this._animFrom + (this._animTo - this._animFrom) * eased;
  }

  _updateUniforms() {
    if (!this._effect) return;

    const p = this._progress();
    const size = this._startSize + (this._size - this._startSize) * p;
    const opacity =
      this._startOpacity + (this._opacity - this._startOpacity) * p;

    // scale the corner radius with the animated size so the squircle keeps
    // its proportions while it shrinks
    const radiusPx = (this._cornerRadius / 50.0) * (size / 2.0);

    this._effect.updateUniforms({
      x: this._x,
      y: this._y,
      size,
      opacity,
      shape: this._shape,
      radius: radiusPx,
      rotation: this._rotation,
      width: global.stage.width,
      height: global.stage.height,
    });
  }

  pollActivation(mask) {
    if (!this._enabled) return;

    const isPressed = isActivationHeld(mask, getActivationMasks(this._key));

    if (isPressed && !this._active) {
      this.activate();
    } else if (!isPressed && this._active) {
      this.deactivate();
    }
  }

  activate() {
    this._shape = getShapeValue(this._settings.get_string("shape"));
    this._rotation = this._settings.get_int("rotation");
    this._cornerRadius = this._settings.get_int("corner-radius");

    this._active = true;

    // reverse an in-flight fade-out rather than stacking a second overlay
    if (this._actor) {
      const from = this._progress();
      this._exiting = false;
      this._startTransition(from, 1.0);
      this._updateUniforms();
      return;
    }

    this._exiting = false;
    this._startTransition(0.0, 1.0);

    this._actor = new St.Widget({
      style_class: "zoomer-spotlight-overlay",
      reactive: false,
      can_focus: false,
      x: 0,
      y: 0,
      width: global.stage.width,
      height: global.stage.height,
      opacity: 255,
    });

    this._effect = new SpotlightEffect();
    this._actor.add_effect(this._effect);

    this._updateUniforms();

    // tracked chrome (not a raw stage child) so the overlay stays above
    // fullscreen windows such as Brave / VSCode in F11
    Main.layoutManager.addChrome(this._actor, {
      trackFullscreen: true,
      affectsStruts: false,
    });
  }

  deactivate() {
    this._active = false;

    if (!this._actor || this._exiting) return;

    this._exiting = true;
    this._startTransition(this._progress(), 0.0);
  }

  /**
   * Re-fit the overlay to the stage after fullscreen or monitor changes.
   */
  syncSize() {
    if (!this._actor) return;
    this._actor.set_size(global.stage.width, global.stage.height);
    this._updateUniforms();
  }

  _destroyActor() {
    if (this._actor) {
      try {
        Main.layoutManager.removeChrome(this._actor);
      } catch (e) {
        // already untracked; fall through to manual unparent
      }
      if (this._actor.get_parent())
        this._actor.get_parent().remove_child(this._actor);
      this._actor.destroy();
      this._actor = null;
    }
    this._effect = null;
    this._exiting = false;
  }

  destroy() {
    if (this._signalIds && this._settings) {
      for (const id of this._signalIds) {
        this._settings.disconnect(id);
      }
      this._signalIds = null;
    }

    if (this._uiSignals) {
      for (const [obj, id] of this._uiSignals) {
        try {
          obj.disconnect(id);
        } catch (e) {
          // already disconnected
        }
      }
      this._uiSignals = null;
    }

    this._active = false;
    this._destroyActor();
    this._settings = null;
  }
}

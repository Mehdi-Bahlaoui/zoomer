// SPDX-License-Identifier: GPL-3.0-or-later

import Clutter from "gi://Clutter";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

/**
 * Manages cloning of desktop scene elements (background, windows, panel)
 * for the magnifier view.
 */
export class SceneCloner {
  constructor(contentGroup) {
    this._contentGroup = contentGroup;

    // clones
    this._bgClone = null;
    this._windowClones = [];
    this._panelClone = null;

    // timing
    this._lastWindowRebuild = null;
    this._needsRebuild = false;
    this._restackedId = null;
  }

  /**
   * Initialize all clones for the scene
   */
  init() {
    this._createBackgroundClone();
    this._rebuildWindowClones();
    this._createPanelClone();

    // raising a window must show up immediately; waiting for the 500 ms
    // poll leaves the magnifier displaying the old stacking order
    this._restackedId = global.display.connect("restacked", () => {
      this._needsRebuild = true;
    });
  }

  /**
   * Destroy all clones and clean up resources
   */
  destroy() {
    if (this._restackedId) {
      global.display.disconnect(this._restackedId);
      this._restackedId = null;
    }

    if (this._bgClone) {
      this._contentGroup.remove_child(this._bgClone);
      this._bgClone.destroy();
      this._bgClone = null;
    }

    this._windowClones.forEach((clone) => {
      if (clone) {
        this._contentGroup.remove_child(clone);
        clone.destroy();
      }
    });
    this._windowClones = [];

    if (this._panelClone) {
      this._contentGroup.remove_child(this._panelClone);
      this._panelClone.destroy();
      this._panelClone = null;
    }
  }

  /**
   * Update clone positions based on cursor and zoom
   * @param {number} curX - Cursor X position
   * @param {number} curY - Cursor Y position
   * @param {number} zoom - Zoom level
   * @param {number} diameter - Magnifier diameter
   * @param {boolean} rebuildWindows - Whether to rebuild window clones
   */
  update(curX, curY, zoom, diameter, rebuildWindows = false) {
    // periodically rebuild window clones (every 500ms)
    if (
      rebuildWindows ||
      this._needsRebuild ||
      !this._lastWindowRebuild ||
      Date.now() - this._lastWindowRebuild > 500
    ) {
      this._rebuildWindowClones();
      this._lastWindowRebuild = Date.now();
      this._needsRebuild = false;
    }

    // transform all clones
    const allLayers = [
      ...this._windowClones,
      this._bgClone,
      this._panelClone,
    ].filter((x) => x);

    allLayers.forEach((clone) => {
      if (!clone) return;

      let sourceX = 0;
      let sourceY = 0;

      if (clone._sourceActor) {
        sourceX = clone._sourceActor.x;
        sourceY = clone._sourceActor.y;
      }

      clone.set_scale(zoom, zoom);
      clone.set_translation(
        diameter / 2 - (curX - sourceX) * zoom,
        diameter / 2 - (curY - sourceY) * zoom,
        0,
      );
    });
  }

  _createBackgroundClone() {
    if (this._bgClone) return;

    // try bgManagers first
    try {
      const bgManagers = Main.layoutManager._bgManagers;
      if (bgManagers && bgManagers.length > 0) {
        const bgManager = bgManagers[0];
        if (bgManager && bgManager.backgroundActor) {
          this._bgClone = new Clutter.Clone({
            source: bgManager.backgroundActor,
            reactive: false,
          });
          this._bgClone._sourceActor = { x: 0, y: 0 };
          this._contentGroup.insert_child_at_index(this._bgClone, 0);
          return;
        }
      }
    } catch (e) {
      console.log(`[Zoomer SceneCloner] bgManagers failed: ${e}`);
    }

    // fallback to backgroundGroup
    try {
      const bgGroup = Main.layoutManager.backgroundGroup;
      if (bgGroup && bgGroup.get_n_children() > 0) {
        const bgActor = bgGroup.get_child_at_index(0);
        if (bgActor) {
          this._bgClone = new Clutter.Clone({
            source: bgActor,
            reactive: false,
          });
          this._bgClone._sourceActor = { x: 0, y: 0 };
          this._contentGroup.insert_child_at_index(this._bgClone, 0);
          return;
        }
      }
    } catch (e) {
      console.log(`[Zoomer SceneCloner] backgroundGroup failed: ${e}`);
    }
  }

  _rebuildWindowClones() {
    if (!this._contentGroup) return;

    // clean up old clones
    this._windowClones.forEach((clone) => {
      if (clone) {
        try {
          this._contentGroup.remove_child(clone);
          clone.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    });
    this._windowClones = [];

    // window actors are returned already in stacking order, bottom to top;
    // sorting list_windows() by child index could not reproduce that
    // reliably and silently fell back to creation order on failure
    let actors = [];
    try {
      actors = global.compositor?.get_window_actors
        ? global.compositor.get_window_actors()
        : global.get_window_actors();
    } catch (e) {
      console.log(`[Zoomer SceneCloner] Failed to get window actors: ${e}`);
      return;
    }

    let workspace = null;
    try {
      workspace = global.workspace_manager.get_active_workspace();
    } catch (e) {
      // no workspace filter, clone everything visible
    }

    // clone each visible window (including popups and transients)
    for (const actor of actors) {
      try {
        const win = actor.meta_window;
        if (!win) continue;
        if (win.is_hidden() || win.minimized) continue;
        if (workspace && !win.located_on_workspace(workspace)) continue;
        if (!actor.visible) continue;

        const clone = new Clutter.Clone({
          source: actor,
          reactive: false,
        });
        clone._sourceActor = actor;

        const insertIndex = this._bgClone ? 1 : 0;
        this._contentGroup.insert_child_at_index(
          clone,
          insertIndex + this._windowClones.length,
        );

        this._windowClones.push(clone);
      } catch (e) {
        // skip windows that fail to clone
        console.log(`[Zoomer SceneCloner] Skipping window: ${e.message}`);
      }
    }
  }

  _createPanelClone() {
    if (this._panelClone) return;

    const panelSource = Main.layoutManager.panelBox;
    if (panelSource) {
      this._panelClone = new Clutter.Clone({
        source: panelSource,
        reactive: false,
      });
      this._contentGroup.add_child(this._panelClone);
    }
  }
}

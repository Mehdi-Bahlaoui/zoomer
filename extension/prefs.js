// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from "gi://Adw";

import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import { buildCoreGroup } from "./prefs/core-group.js";
import { buildPhysicsGroup } from "./prefs/physics-group.js";
import { buildMagnifierGroup } from "./prefs/magnifier-group.js";
import {
  buildSpotlightGroup,
  buildSpotlightTransitionGroup,
} from "./prefs/spotlight-group.js";

export default class ZoomerPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const appearancePage = new Adw.PreferencesPage({
      title: "Appearance",
      icon_name: "preferences-desktop-appearance-symbolic",
    });
    appearancePage.add(buildCoreGroup(settings));
    window.add(appearancePage);

    const behaviorPage = new Adw.PreferencesPage({
      title: "Behavior",
      icon_name: "preferences-system-symbolic",
    });
    behaviorPage.add(buildPhysicsGroup(settings));
    window.add(behaviorPage);

    const spotlightPage = new Adw.PreferencesPage({
      title: "Spotlight",
      icon_name: "display-brightness-symbolic",
    });
    spotlightPage.add(buildSpotlightGroup(settings));
    spotlightPage.add(buildSpotlightTransitionGroup(settings));
    window.add(spotlightPage);

    const magnifierPage = new Adw.PreferencesPage({
      title: "Magnifier",
      icon_name: "zoom-in-symbolic",
    });
    magnifierPage.add(buildMagnifierGroup(settings));
    window.add(magnifierPage);
  }
}

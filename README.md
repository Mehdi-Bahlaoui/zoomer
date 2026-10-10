<div align="center">
  <img src="assets/zoomer_icon.svg" width="150" height="150" alt="Zoomer Icon">
  <h1>Zoomer</h1>
  <p><strong>Native cursor highlighter for GNOME Shell on Wayland.</strong></p>

  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-GPL--3.0-green?style=flat-square" alt="License">
  </a>
  <a href="https://wayland.freedesktop.org">
    <img src="https://img.shields.io/badge/Platform-Wayland-orange?style=flat-square" alt="Wayland">
  </a>
</div>

<br>

## Overview

**Zoomer** is a GNOME Shell extension designed to solve a specific problem: demonstrating software on Wayland. Traditional X11 overlay tools often fail or introduce lag on Wayland compositors. Zoomer integrates directly into the GNOME Shell rendering pipeline using GLSL shaders, ensuring zero latency and perfect frame synchronization.

> **Fork note:** Zoomer is an independent fork of [Hati](https://github.com/szymonwilczek/hati) by Szymon Wilczek. It uses its own extension UUID (`zoomer@Mehdi-Bahlaoui`) and settings path, so it is never auto-updated to — nor confused with — the upstream extension.

It provides instant cursor-centered utilities, essential for:
- **Teaching / Lectures**
- **Screen Recording**
- **Live Demonstrations**
- **Accessibility**

## Preview

https://github.com/user-attachments/assets/778d996f-08ca-45d9-92bc-cc9d4ac6312a

## Features

| Category | Description |
|----------|-------------|
| **Performance** | **Memory:** ~2-3MB. **Render Time:** ~4.7ms/frame. **Zero Copy** tracking. |
| **Utilities** | **Spotlight Mode** (dim screen except cursor), **GPU Magnifier** (instant zoom). Customizable shortcuts. Both stay visible above fullscreen windows. |
| **Lens** | Shared lens geometry: Size, Shape (Circle/Squircle/Square), Corner Radius, Rotation. Smooth inertia-based cursor tracking. |
| **Config** | Changes apply instantly through a native GTK4 preferences window. |

## Installation

### Method 1: Release zip

Zoomer is intentionally **not** published on extensions.gnome.org under the upstream listing, so it can never be auto-updated back to Hati. Install from this repo instead.

1. Download the latest release from [Releases](https://github.com/Mehdi-Bahlaoui/zoomer/releases).
2. Install via CLI:
   ```bash
   gnome-extensions install zoomer@Mehdi-Bahlaoui.zip
   ```
3. Restart GNOME Shell (Log out/in on Wayland).
4. Enable the extension:
   ```bash
   gnome-extensions enable zoomer@Mehdi-Bahlaoui
   ```

### Method 2: Build from Source

You'll need following dependencies: 
- `make`
- `zip`

```bash
# Clone repository
git clone https://github.com/Mehdi-Bahlaoui/zoomer.git
cd zoomer

# Build and install
make install
```

#### Alternative: Shell Script (No Make required)
If you don't have `make` installed, you can use the provided script:
```bash
./scripts/install.sh
```

## Configuration

Settings can be accessed via the **Extensions** app or by right-clicking the extension icon if enabled. 

- **Appearance:** Lens Size, Shape (Circle/Squircle/Square), Corner Radius, Rotation.
- **Behavior:** Inertia physics sliders (cursor follow smoothing).
- **Spotlight:** Activation key, hole size, shrink transition.
- **Magnifier:** Activation key, zoom level.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[GPL-3.0](LICENSE)

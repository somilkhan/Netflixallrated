---
name: Player provider boundaries
description: Native and iframe playback support different enhancement capabilities.
---

Native HTML5/HLS playback can expose browser-backed controls such as playback rate, Picture-in-Picture, keyboard shortcuts, and local subtitle styling. Cross-origin iframe providers cannot be controlled reliably from the host app; their controls must remain provider-owned, while surrounding UI should clearly expose only supported actions.

**Why:** Browser same-origin policy prevents the host application from inspecting or controlling media inside third-party iframe providers.

**How to apply:** Add advanced playback behavior to the native player first. For iframe sources, provide shell-level actions, provider switching, reload, fullscreen, and honest unsupported-state messaging rather than simulated controls.
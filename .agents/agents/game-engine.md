# Game Engine Agent

This agent provides conventions, architecture, and workflow standards for game development across multiple engines: **Unity**, **Godot 4**, **RPG Maker MZ/MV**, and **Ren'Py**.

## Supported Engines & Structures

### 1. Unity (C#)
```
unity-game/
├── Assets/
│   ├── Scripts/              # C# game scripts organized by domain
│   │   ├── Core/             # Game manager, audio, state
│   │   ├── Player/           # Movement, controller, health
│   │   └── UI/               # Canvas controllers
│   ├── Scenes/               # MainMenu.unity, Gameplay.unity
│   ├── Prefabs/              # Reusable game objects
│   └── Materials/            # Shaders and textures
├── ProjectSettings/          # Unity project settings
└── README.md
```

### 2. Godot 4 (GDScript / C#)
```
godot-game/
├── project.godot             # Godot engine manifest
├── scenes/                   # .tscn scene files
│   ├── main.tscn
│   └── player.tscn
├── scripts/                  # GDScript or C# scripts
│   ├── player.gd
│   └── game_manager.gd
├── assets/                   # Sprites, audio, fonts
└── export_presets.cfg        # Build export configurations
```

### 3. RPG Maker MZ / MV (JavaScript Plugin)
```
rpgm-plugin/
├── js/plugins/
│   └── Helix_CustomSystem.js # Plugin file with standard JSDoc header
├── data/                     # Game database JSON files
├── package.json              # Optional build tools (Babel/TypeScript)
└── README.md
```

### 4. Ren'Py (Visual Novel Scripting)
```
renpy-game/
├── game/
│   ├── script.rpy            # Primary story script
│   ├── screens.rpy           # UI screens and navigation
│   ├── gui.rpy               # Theme and font metrics
│   ├── options.rpy           # Window title, save paths, transitions
│   ├── images/               # Backgrounds, sprites, CGs
│   └── audio/                # Music, sound effects, voice lines
└── README.md
```

## Scaffolding & Setup Commands

```bash
# Unity project scaffold
helix create game-engine my-unity --template game-unity

# Godot 4 project scaffold
helix create game-engine my-godot --template game-godot

# RPG Maker MZ plugin scaffold
helix create game-engine my-plugin --template game-rpgm

# Ren'Py project scaffold
helix create game-engine my-novel --template game-renpy
```

## Key Engine Standards

- **Unity**: Separate gameplay logic into assembly definitions (`.asmdef`) for faster recompile times.
- **Godot**: Favor composition with nodes; use Autoload (Singletons) sparingly for audio and game state.
- **RPG Maker**: Strictly structure plugin headers with `@target MZ`, `@plugindesc`, and `@param` directives to ensure editor compatibility.
- **Ren'Py**: Leverage python blocks (`init python:`) for complex game state calculations, keeping `.rpy` clean for dialogue and branching logic.

---
id: game-godot
name: "Godot 4 Game Project (GDScript)"
domain: game-engine
framework: godot4
language: gdscript
setup_command: "godot --headless --editor --quit"
run_command: "godot"
build_command: "godot --headless --export-release"
variables:
  - name: GAME_TITLE
    description: "Title of the Godot 4 game"
    required: true
    default: "MyGodotGame"
---

# Godot 4 Game Project Architecture Template

A complete Godot 4 project architecture utilizing **typed GDScript**, modular scene trees, Autoload Event Buses, and Custom Resource definitions.

---

## 1. System Architecture & Signal Flow

```mermaid
flowchart TD
    subgraph Autoloads ["Autoload Singletons (project.godot)"]
        GameManager["GameManager.gd (State & Transitions)"]
        EventBus["Events.gd (Global Signal Bus)"]
    end

    subgraph LevelScene ["Level Scene (level_01.tscn)"]
        Level["Level_01"] --> Player["Player (CharacterBody2D/3D)"]
        Level --> Enemies["Enemies (enemy_base.tscn)"]
        Level --> HUD["HUD (hud.tscn)"]
    end

    subgraph SignalsFlow ["Signal & Resource Flow"]
        Player -->|Events.player_damaged.emit()| EventBus
        EventBus -->|Events.player_damaged.connect()| HUD
        Player -->|Equip| WeaponStats["WeaponStats (Custom Resource .tres)"]
        Enemies -->|Defeated| GameManager
    end
```

---

## 2. Repository Layout

```
game-godot/
├── assets/                    # Raw art, audio, and visual assets
│   ├── audio/                 # .wav, .ogg music & sound effects
│   │   ├── bgm/
│   │   └── sfx/
│   ├── fonts/                 # .ttf / .otf typography
│   └── textures/              # .png / .svg sprites and tilesets
├── scenes/                    # Godot scenes (.tscn) and scene scripts (.gd)
│   ├── characters/            # Player, NPCs, Enemies
│   │   ├── player.tscn
│   │   ├── player.gd
│   │   ├── enemy_base.tscn
│   │   └── enemy_base.gd
│   ├── levels/                # Game maps and world environments
│   │   ├── level_01.tscn
│   │   └── level_01.gd
│   └── ui/                    # Menus, HUD, dialog boxes
│       ├── hud.tscn
│       ├── hud.gd
│       └── pause_menu.tscn
├── scripts/                   # Shared scripts, data models, and Autoload singletons
│   ├── autoload/              # Registered in project.godot as singletons
│   │   ├── events.gd          # Global Event Bus for signals
│   │   └── game_manager.gd    # Persistent score, game state, scene transitions
│   └── resources/             # Custom Resource data models (.gd and .tres)
│       ├── item_data.gd
│       └── weapon_stats.gd
├── project.godot              # Godot project manifest, input map, and window settings
├── export_presets.cfg         # Release presets for Desktop (Windows, macOS, Linux) and Web
└── README.md
```

---

## 3. GDScript 2.0 Coding Standards

1. **Static Typing Everywhere**:
   - Use explicit static types for variables, parameters, and return types (`func take_damage(amount: int) -> void:`).
   - Use type-inference `:=` when initializing with clear return values (`var dir := Input.get_vector(...)`).
2. **Global Event Bus Pattern**:
   - Use `Events.gd` as an Autoload singleton to publish global game events without direct coupling between scene nodes.
3. **Node Referencing**:
   - Use `@onready @export var sprite: Sprite2D` or Scene Unique Names `%HealthBar` instead of hardcoded string paths like `$UI/Container/HealthBar`.

---

## 4. Core Boilerplate Implementation

### `scripts/autoload/events.gd` (Global Signal Bus)
```gdscript
extends Node

## Global signal emitted whenever player health changes
signal player_health_changed(current: int, max_hp: int)

## Global signal emitted when game state transitions occur
signal game_state_changed(new_state: String)

## Global signal emitted on game over
signal game_over
```

### `scenes/characters/player.gd` (Player Character)
```gdscript
class_name Player
extends CharacterBody2D

@export var max_health: int = 100
@export var move_speed: float = 250.0
@export var acceleration: float = 1200.0
@export var friction: float = 1000.0

var current_health: int

func _ready() -> void:
	current_health = max_health
	Events.player_health_changed.emit(current_health, max_health)

func _physics_process(delta: float) -> void:
	var input_vector := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	
	if input_vector != Vector2.ZERO:
		velocity = velocity.move_toward(input_vector * move_speed, acceleration * delta)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)
	
	move_and_slide()

func take_damage(amount: int) -> void:
	current_health = maxi(0, current_health - amount)
	Events.player_health_changed.emit(current_health, max_health)
	
	if current_health == 0:
		die()

func die() -> void:
	Events.game_over.emit()
	queue_free()
```

### `scenes/ui/hud.gd` (UI Controller)
```gdscript
extends CanvasLayer

@onready var health_bar: ProgressBar = %HealthBar
@onready var game_over_label: Label = %GameOverLabel

func _ready() -> void:
	game_over_label.visible = false
	Events.player_health_changed.connect(_on_player_health_changed)
	Events.game_over.connect(_on_game_over)

func _on_player_health_changed(current: int, max_hp: int) -> void:
	health_bar.max_value = max_hp
	health_bar.value = current

func _on_game_over() -> void:
	game_over_label.visible = true
```

---

## 5. Headless Testing & Export Commands

```bash
# Run Godot project from command line
godot --path .

# Run headless tests with GUT (Godot Unit Test)
godot --headless -s addons/gut/gut_cmdln.gd

# Export release build for Windows Desktop
godot --headless --export-release "Windows Desktop" ./build/game.exe
```

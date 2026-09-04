# Skill: Godot 4 GDScript & Architecture

## Overview
Standards and code recipes for 2D and 3D games in Godot 4 using GDScript 2.0 and node-based scene composition.

## Core GDScript 2.0 Features
- **Static Typing**: Annotate variables, arguments, and return values (`var count: int = 0`).
- **Annotations**: `@export`, `@onready`, `@rpc`, `@tool`.
- **Lambda Expressions & Callables**: `callable.call()`, `connect("signal", func(): pass)`.

## Character Controller Example (`scripts/player.gd`)
```gdscript
class_name Player
extends CharacterBody2D

@export var speed: float = 300.0
@export var jump_velocity: float = -400.0

var gravity: int = ProjectSettings.get_setting("physics/2d/default_gravity")

func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity.y += gravity * delta

	if Input.is_action_just_pressed("ui_accept") and is_on_floor():
		velocity.y = jump_velocity

	var direction: float = Input.get_axis("ui_left", "ui_right")
	if direction:
		velocity.x = direction * speed
	else:
		velocity.x = move_toward(velocity.x, 0, speed)

	move_and_slide()
```

## Scene Architecture Best Practices
- **Scene Instantiation**: Favor small, reusable scenes over large monolithic scenes.
- **Signal Down, Call Up**: Parents invoke methods on child nodes; child nodes emit signals to communicate with parent nodes.
- **Autoloads**: Use autoloaded singleton nodes for global data (audio playback, save game controller, scene transition manager).

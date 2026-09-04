# Skill: Unity C# Development

## Overview
Architectural guidelines, C# scripting conventions, and project structure standards for Unity 2D/3D development.

## Project Structure
- `Assets/Scripts/Core`: Application entry point, state machines, sound managers.
- `Assets/Scripts/Gameplay`: Player controllers, combat, mechanics, physics.
- `Assets/Scripts/UI`: Canvas presenters, view models, HUD binders.
- `Assets/Scripts/Data`: ScriptableObjects for configuration and game balancing.

## Clean Scripting Pattern: Player Controller
```csharp
using UnityEngine;

namespace Helix.Gameplay
{
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement Settings")]
        [SerializeField] private float moveSpeed = 6.0f;
        [SerializeField] private float gravity = -9.81f;

        private CharacterController controller;
        private Vector3 velocity;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
        }

        private void Update()
        {
            float moveX = Input.GetAxis("Horizontal");
            float moveZ = Input.GetAxis("Vertical");

            Vector3 move = transform.right * moveX + transform.forward * moveZ;
            controller.Move(move * moveSpeed * Time.deltaTime);

            if (controller.isGrounded && velocity.y < 0)
            {
                velocity.y = -2f;
            }

            velocity.y += gravity * Time.deltaTime;
            controller.Move(velocity * Time.deltaTime);
        }
    }
}
```

## Assembly Definitions (`.asmdef`)
Organize subfolders into Assembly Definitions (`Helix.Core.asmdef`, `Helix.Gameplay.asmdef`) to dramatically cut iteration and domain reload times.

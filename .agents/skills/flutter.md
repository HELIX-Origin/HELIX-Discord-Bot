# Skill: Flutter Development

## Overview
Architectural standards and best practices for cross-platform iOS, Android, and Desktop applications built with Flutter and Dart.

## Project Structure & Architecture
Adopt Feature-First or Clean Architecture layers:
- `data`: Models, API clients, local database (Isar/Hive/Drift).
- `domain`: Entities, repository interfaces, use cases.
- `presentation`: UI widgets, screens, and state management providers.

## Recommended State Management: Riverpod
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final counterProvider = StateProvider<int>((ref) => 0);

class CounterScreen extends ConsumerWidget {
  const CounterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Flutter Counter')),
      body: Center(child: Text('Count: $count', style: const TextStyle(fontSize: 24))),
      floatingActionButton: FloatingActionButton(
        onPressed: () => ref.read(counterProvider.notifier).state++,
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

## Essential CLI Commands
```bash
# Verify environment health
flutter doctor

# Fetch packages
flutter pub get

# Run on connected device or emulator
flutter run

# Build release APK / App Bundle
flutter build apk --release
flutter build appbundle
```

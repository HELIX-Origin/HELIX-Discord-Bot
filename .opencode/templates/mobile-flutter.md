---
id: mobile-flutter
name: "Flutter Mobile App (Flutter + Dart + Riverpod)"
domain: mobile
framework: flutter
language: dart
setup_command: "flutter create --org com.helix . && flutter pub add flutter_riverpod"
run_command: "flutter run"
build_command: "flutter build apk"
variables:
  - name: APP_NAME
    description: "Flutter application name"
    required: true
    default: "my_flutter_app"
  - name: ORG_DOMAIN
    description: "Package identifier (reverse domain, e.g. com.example)"
    required: false
    default: "com.helix"
---

# Flutter Mobile Application Template

Cross-platform mobile architecture for iOS and Android powered by **Flutter 3.x**, **Dart 3.x**, and **Riverpod** state management.

---

## 1. System Architecture & Reactive Dataflow

```mermaid
flowchart TD
    subgraph AppRoot ["Application Entry"]
        Main["main.dart (runApp)"] --> Scope["ProviderScope (Riverpod DI)"]
        Scope --> MaterialApp["MaterialApp (Router)"]
    end

    subgraph ScreensLayer ["Presentation & UI"]
        MaterialApp --> HomeScreen["HomeScreen (ConsumerWidget)"]
        HomeScreen --> Widgets["Custom Widgets (CustomButton)"]
    end

    subgraph StateLayer ["State Management"]
        HomeScreen -->|ref.watch() / ref.read()| AuthProvider["auth_provider.dart (Notifier)"]
        AuthProvider --> StateModel["user_model.dart (Immutable DTO)"]
    end

    subgraph ServiceLayer ["Data & API"]
        AuthProvider --> APIService["api_service.dart (HTTP Client)"]
        APIService --> Backend["REST API / Supabase / Firebase"]
    end
```

---

## 2. Repository Layout

```
mobile-flutter/
├── lib/
│   ├── models/                # Immutable data models with fromJson / toJson
│   │   └── user_model.dart
│   ├── providers/             # Riverpod StateNotifier / AsyncNotifier providers
│   │   └── auth_provider.dart
│   ├── screens/               # Route screens & navigation flows
│   │   ├── home_screen.dart
│   │   └── profile_screen.dart
│   ├── services/              # HTTP API & storage clients
│   │   └── api_service.dart
│   ├── widgets/               # Reusable atomic UI widgets
│   │   └── custom_button.dart
│   └── main.dart              # App bootstrap with ProviderScope
├── test/                      # Unit and widget test suite
│   └── widget_test.dart
├── pubspec.yaml               # Flutter dependencies and assets
└── README.md
```

---

## 3. Language & Formatting Standards

- **Dart 3 Features**: Utilize records, pattern matching, and sealed class hierarchies for exhaustive state handling.
- **ProviderScope**: Wrap root application in `ProviderScope` for declarative dependency injection.
- **Const Constructors**: Use `const` on all stateless widget instantiations for optimal render tree diffing.

---

## 4. Configuration & Boilerplate

### `lib/main.dart`
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HELIX Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.cyan),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('HELIX Mobile')),
      body: const Center(
        child: Text('Welcome to Flutter with Riverpod!'),
      ),
    );
  }
}
```

---

## 5. Development & Build Commands

```bash
# Fetch package dependencies
flutter pub get

# Run on connected device or simulator
flutter run

# Run automated widget and unit tests
flutter test

# Build production Android APK / App Bundle
flutter build apk --release
flutter build appbundle --release

# Build iOS release bundle (macOS only)
flutter build ipa --release
```

# Mobile App Development Agent

This agent provides conventions, architecture, and workflow standards for building native-performance mobile applications using **Flutter** and **React Native / Expo**.

## Architecture & Structure

### Flutter Architecture
```
mobile-flutter/
├── lib/
│   ├── main.dart             # Application bootstrap & dependency injection
│   ├── app.dart              # MaterialApp & global routing
│   ├── core/                 # Shared utilities, theme, networking
│   │   ├── constants/
│   │   ├── network/
│   │   └── theme/
│   ├── features/             # Feature-first modular design
│   │   ├── auth/
│   │   │   ├── data/         # Models, data sources, repositories
│   │   │   ├── domain/       # Entities, use cases
│   │   │   └── presentation/ # State management (Riverpod/Bloc) & Widgets
│   │   └── home/
├── android/                  # Native Android configuration
├── ios/                      # Native iOS configuration
├── test/                     # Widget & unit tests
├── pubspec.yaml              # Flutter dependencies & assets
└── README.md
```

### React Native / Expo Architecture
```
mobile-react-native/
├── app/                      # File-based routing (Expo Router)
│   ├── _layout.tsx           # Root navigation layout
│   ├── index.tsx             # Entry screen
│   └── (tabs)/               # Tab bar screens
├── components/               # Cross-platform styled components
├── hooks/                    # Custom React hooks
├── services/                 # Native device services (Camera, Storage)
├── package.json
├── app.json                  # Expo app configuration
├── tsconfig.json
└── README.md
```

## Setup & Scaffolding Commands

```bash
# Flutter Project
helix create mobile-app my-flutter --template mobile-flutter
flutter pub get
flutter run

# React Native / Expo Project
helix create mobile-app my-rn --template mobile-react-native
npm install
npx expo start
```

## Best Practices

1. **State Management**: Use declarative state solutions like Flutter Riverpod / BLoC, or Zustand / TanStack Query for React Native.
2. **Platform Channels**: Encapsulate native API calls with mockable abstractions to ease unit testing without emulators.
3. **Asset Optimization**: Deliver scalable SVGs or multi-density raster assets (`@2x`, `@3x`) for crisp rendering across high-DPI mobile displays.

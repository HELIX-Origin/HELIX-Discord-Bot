---
id: mobile-react-native
name: "React Native Mobile App (Expo Router + TypeScript)"
domain: mobile
framework: expo
language: typescript
setup_command: "npx create-expo-app@latest . --template tabs@sdk-51"
run_command: "npx expo start"
build_command: "npx eas build"
variables:
  - name: APP_NAME
    description: "Mobile application name"
    required: true
    default: "my-mobile-app"
---

# React Native & Expo Mobile App Template

Native mobile application for iOS and Android powered by **Expo SDK 51+**, **Expo Router (File-based Routing)**, and **TypeScript**.

---

## 1. System Architecture & File-Based Navigation

```mermaid
flowchart TD
    subgraph ExpoHost ["Expo Native Runtime"]
        Metro["Metro Bundler (npx expo start)"] --> Bridge["React Native Bridge / JSI"]
        Bridge --> RootLayout["app/_layout.tsx (Stack Provider)"]
    end

    subgraph RouterTree ["Expo Router (File-Based Navigation)"]
        RootLayout --> TabsGroup["app/(tabs)/_layout.tsx"]
        TabsGroup --> HomeTab["app/(tabs)/index.tsx (Home Tab)"]
        TabsGroup --> ExploreTab["app/(tabs)/explore.tsx (Explore Tab)"]
        RootLayout --> ModalScreen["app/modal.tsx (Presentation Modal)"]
    end

    subgraph UITheme ["Theming & Atomic Components"]
        HomeTab --> ThemedText["components/ThemedText.tsx"]
        HomeTab --> CustomButton["components/Button.tsx"]
        ThemedText --> Colors["constants/Colors.ts (Dark / Light)"]
    end
```

---

## 2. Repository Layout

```
mobile-react-native/
├── app/                       # File-based routing navigation tree
│   ├── (tabs)/                # Bottom tab navigation group
│   │   ├── index.tsx          # Home tab
│   │   └── explore.tsx        # Explore tab
│   ├── _layout.tsx            # Root navigation stack
│   └── modal.tsx              # Modal presentation screen
├── components/                # Reusable UI component library
│   ├── Button.tsx
│   └── ThemedText.tsx
├── constants/                 # Color schemes, typography, spacing
│   └── Colors.ts
├── hooks/                     # Custom React Native hooks
│   └── useColorScheme.ts
├── app.json                   # Expo application manifest & bundle identifier
├── tsconfig.json              # TypeScript compiler settings
└── package.json
```

---

## 3. Setup & Development Commands

```bash
# Install dependencies
npm install

# Start Metro Bundler with Expo Go QR code
npx expo start

# Run on iOS Simulator (macOS only)
npx expo start --ios

# Run on Android Emulator
npx expo start --android

# Build native binaries via EAS (Expo Application Services)
npx eas build --platform all
```

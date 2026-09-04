# Skill: React Native & Expo Development

## Overview
Standards, patterns, and workflows for building cross-platform native iOS and Android apps using React Native, TypeScript, and the Expo framework with Expo Router.

## Recommended Stack
- **Framework**: Expo SDK (Managed Workflow)
- **Routing**: Expo Router (file-based navigation matching Next.js paradigms)
- **State**: Zustand / TanStack Query
- **Styling**: NativeWind (Tailwind CSS for React Native) or StyleSheet

## Project Scaffolding
```bash
npx create-expo-app@latest my-mobile-app --template tabs
cd my-mobile-app
npm start
```

## Expo Router Screen Structure (`app/(tabs)/index.tsx`)
```tsx
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to HELIX Mobile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
```

## Prebuild & Native Modules
When custom native code or third-party SDKs requiring CocoaPods/Gradle are needed:
```bash
npx expo prebuild
npx expo run:android
npx expo run:ios
```

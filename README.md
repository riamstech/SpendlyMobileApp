# Spendly Mobile App (React Native + Expo)

This is the React Native mobile app for Spendly, built with Expo.

## 🚀 Quick Start

### 1. Install Dependencies

First, fix npm cache permissions (run this in your terminal):
```bash
sudo chown -R $(whoami) ~/.npm
```

Then install dependencies:
```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
npm install
```

### 2. Run the App

```bash
# Start Expo Dev Server
npm start

# Run on Android
npm run android

# Run on iOS  
npm run ios

# Run on Web
npm run web
```

## 📱 Testing on Physical Device

### Android (Your Huawei Phone):
1. Install **Expo Go** app from Google Play Store
2. Run `npm start` on your computer
3. Scan the QR code with Expo Go app
4. App will load on your phone! ✅

### iOS:
1. Install **Expo Go** from App Store
2. Run `npm start`
3. Scan QR code with Camera app
4. Opens in Expo Go

## 📂 Project Structure

```
SpendlyMobileApp/
├── src/
│   ├── screens/         # All screens (Login, Dashboard, etc.)
│   ├── components/      # Reusable components
│   ├── navigation/      # React Navigation setup
│   ├── api/            # API calls (can copy from SpendlyApp!)
│   ├── hooks/          # Custom hooks (can copy from SpendlyApp!)
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript types
│   └── constants/      # Constants and config
├── assets/             # Images, fonts, etc.
├── App.tsx            # Main app entry point
└── package.json
```

## 🔄 Migration from SpendlyApp (Cordova)

### What Can Be Copied Directly (100%):
- ✅ `/src/api/` - All API calls
- ✅ `/src/hooks/` - All custom hooks  
- ✅ `/src/utils/` - All utility functions
- ✅ `/src/types/` - All TypeScript types
- ✅ All business logic

### What Needs Conversion:
- 🔄 Components: `<div>` → `<View>`, `<span>` → `<Text>`
- 🔄 Styling: Tailwind CSS → StyleSheet or NativeWind
- 🔄 Navigation: React Router → React Navigation
- 🔄 Animations: Framer Motion → React Native Reanimated

## 🎨 Styling Options

### Option 1: StyleSheet (Built-in)
```tsx
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
});
```

### Option 2: NativeWind (Tailwind for React Native)
```bash
npm install nativewind tailwindcss
```

```tsx
<View className="flex-1 bg-white">
  <Text className="text-lg font-bold">Hello</Text>
</View>
```

## 📦 Recommended Packages to Install

```bash
# Navigation
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# UI Components
npm install react-native-elements

# State Management (if needed)
npm install zustand

# API Calls (already using fetch, but if you want)
npm install axios

# Animations
npm install react-native-reanimated
```

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
npm install
npx expo start --clear
```

### Metro bundler issues
```bash
npx expo start -c
```

### Android build issues
```bash
npx expo prebuild --clean
```

## 🎯 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Run on your Huawei phone with Expo Go
3. 🔄 Create basic screens
4. 🔄 Copy API logic from SpendlyApp
5. 🔄 Copy hooks from SpendlyApp
6. 🔄 Build UI components
7. 🔄 Test and polish

## 📚 Useful Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [NativeWind](https://www.nativewind.dev/)

## 💡 Why This Will Work

Unlike Cordova (WebView), React Native:
- ✅ Uses **native components** (no WebView!)
- ✅ Works on **ALL Android devices** (including your Huawei)
- ✅ No rendering issues
- ✅ Better performance
- ✅ Smooth animations

Your app will work perfectly! 🎉


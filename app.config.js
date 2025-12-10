require('dotenv').config();

module.exports = {
  expo: {
    name: "Spendly",
    slug: "SpendlyMobileApp",
    scheme: "spendly",
    version: "1.0.0",
    main: "index.ts",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.spendly.mobile",
      buildNumber: "1",
      deploymentTarget: "13.4",
      icon: "./assets/icon.png",
      displayName: "Spendly Money",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              process.env.GOOGLE_IOS_URL_SCHEME || "com.googleusercontent.apps.913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu",
              "spendly"
            ]
          }
        ]
      },
      googleServicesFile: "./GoogleService-Info.plist",
      appleTeamId: "9YJ79K2L2D"
    },
    android: {
      package: "com.spendly.money",
      label: "Spendly",
      icon: "./assets/icon.png",
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.POST_NOTIFICATIONS"
      ],
      googleServicesFile: "./google-services.json"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "69fcbfda-6485-4d30-9d69-3cefc6544941"
      },
      // Environment variables accessible via Constants.expoConfig.extra
      apiBaseUrl: process.env.API_BASE_URL || "https://api.spendly.money/api",
      apiStorageUrl: process.env.API_STORAGE_URL || "https://api.spendly.money/storage",
      apiTimeout: parseInt(process.env.API_TIMEOUT || "30000", 10),
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || "913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com",
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID || "913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu.apps.googleusercontent.com",
      googleIosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME || "com.googleusercontent.apps.913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu"
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "The app accesses your photos to let you share them.",
          cameraPermission: "The app accesses your camera to let you take photos.",
          microphonePermission: "The app accesses your microphone to record videos."
        }
      ],
      [
        "expo-build-properties",
        {
          ios: {
            useModularHeaders: true
          }
        }
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME || "com.googleusercontent.apps.913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu"
        }
      ]
    ]
  }
};

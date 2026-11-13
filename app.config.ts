import type { ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "com.hustlecoder.habitbattle.dev";
  } else if (IS_PREVIEW) {
    return "com.hustlecoder.habitbattle.preview";
  } else {
    return "com.hustlecoder.habitbattle";
  }
};

const getAppName = () => {
  if (IS_DEV) {
    return "Habit Battle (Dev)";
  } else if (IS_PREVIEW) {
    return "Habit Battle (Preview)";
  } else {
    return "Habit Battle";
  }
};

const config: ExpoConfig = {
  name: getAppName(),
  slug: "habit-battle",
  scheme: "habitbattle",
  version: "1.0.0",
  updates: {
    url: "https://u.expo.dev/5ead202a-8c50-4a4d-8077-d9c04a0418c0",
  },
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
    runtimeVersion: "1.0.0", 
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
    },
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: "resize",
    package: getUniqueIdentifier(),
    permissions: [
      "android.permission.READ_CONTACTS",
      "android.permission.WRITE_CONTACTS",
    ],
  },
  web: {},
  plugins: [
    "expo-router",
    "expo-status-bar",
    "expo-splash-screen",
    "expo-secure-store",
    "expo-notifications",
    [
      "expo-contacts",
      {
        contactsPermission:
          "Allow Habit Battle to access your contacts so you can find and invite friends.",
      },
    ],
  ],
  extra: {
    router: {
      asyncRoutes: {
        web: true,
      },
    },
    eas: {
      projectId: "5ead202a-8c50-4a4d-8077-d9c04a0418c0",
    },
  },
  owner: "hustler_ankur",
};

export default config;

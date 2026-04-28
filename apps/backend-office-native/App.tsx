import type { ReactNode } from "react";
import { View, StatusBar, Platform, LogBox } from "react-native";
import { useFonts } from "expo-font";
import Navigation from "./src/navigation/Navigation";
import ConvexClientProvider from "./ConvexClientProvider";
import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import { initSentry } from "./src/lib/monitoring/sentry";

initSentry();

const ThemedShell = ({ children }: { children: ReactNode }) => {
  const { theme } = useTheme();
  const STATUS_BAR_HEIGHT =
    Platform.OS === "ios" ? 50 : StatusBar.currentHeight;
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          height: STATUS_BAR_HEIGHT,
          backgroundColor: theme.colors.primary,
        }}
      >
        <StatusBar
          translucent
          backgroundColor={theme.colors.primary}
          barStyle="light-content"
        />
      </View>
      {children}
    </View>
  );
};

export default function App() {
  LogBox.ignoreLogs(["Warning: ..."]);
  LogBox.ignoreAllLogs();

  const [loaded] = useFonts({
    Bold: require("./src/assets/fonts/Inter-Bold.ttf"),
    SemiBold: require("./src/assets/fonts/Inter-SemiBold.ttf"),
    Medium: require("./src/assets/fonts/Inter-Medium.ttf"),
    Regular: require("./src/assets/fonts/Inter-Regular.ttf"),

    MBold: require("./src/assets/fonts/Montserrat-Bold.ttf"),
    MSemiBold: require("./src/assets/fonts/Montserrat-SemiBold.ttf"),
    MMedium: require("./src/assets/fonts/Montserrat-Medium.ttf"),
    MRegular: require("./src/assets/fonts/Montserrat-Regular.ttf"),
    MLight: require("./src/assets/fonts/Montserrat-Light.ttf"),
  });
  if (!loaded) {
    return false;
  }

  return (
    <ConvexClientProvider>
      <ThemeProvider trade={undefined}>
        <ThemedShell>
          <Navigation />
        </ThemedShell>
      </ThemeProvider>
    </ConvexClientProvider>
  );
}

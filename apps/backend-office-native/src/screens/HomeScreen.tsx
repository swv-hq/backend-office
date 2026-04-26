import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActionSheetIOS,
  Alert,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useTheme } from "../theme/ThemeProvider";
import { useTerminology } from "../theme/useTerminology";

const HomeScreen = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { theme } = useTheme();
  const terminology = useTerminology();

  const handleLogout = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Log out"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            signOut();
          }
        },
      );
    } else {
      Alert.alert("Log out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Log out", style: "destructive", onPress: () => signOut() },
      ]);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.welcome, { color: theme.colors.textPrimary }]}>
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Your {terminology.jobLabelPlural}
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleLogout}
        style={[styles.logoutButton, { borderColor: theme.colors.secondary }]}
      >
        <Text style={[styles.logoutText, { color: theme.colors.textPrimary }]}>
          Log out
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 100,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  content: {
    alignItems: "center",
  },
  welcome: {
    fontSize: RFValue(24),
    fontFamily: "SemiBold",
  },
  subtitle: {
    fontSize: RFValue(16),
    fontFamily: "Regular",
    marginTop: 8,
  },
  logoutButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: RFValue(14),
    fontFamily: "SemiBold",
  },
});

export default HomeScreen;

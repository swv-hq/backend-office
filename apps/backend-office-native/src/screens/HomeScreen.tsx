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

const HomeScreen = () => {
  const { signOut } = useClerk();
  const { user } = useUser();

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
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcome}>
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
        </Text>
        <Text style={styles.subtitle}>Back-End Office</Text>
      </View>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    color: "#2D2D2D",
  },
  subtitle: {
    fontSize: RFValue(16),
    fontFamily: "Regular",
    color: "#666",
    marginTop: 8,
  },
  logoutButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D0D5DD",
  },
  logoutText: {
    fontSize: RFValue(14),
    fontFamily: "SemiBold",
    color: "#344054",
  },
});

export default HomeScreen;

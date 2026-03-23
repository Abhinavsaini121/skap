import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Text, TouchableOpacity } from "react-native";
import { useDispatch } from "react-redux";
import styles from "../assets/styles/profile.styles";
import COLORS from "../constants/colors";
import { logout } from "../store/authSlice";
import { tokenStorage } from "../utils/tokenStorage";

export default function LogoutButton() {
  const dispatch = useDispatch();
  const router = useRouter();

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: async () => { 
        // Clear tokens from AsyncStorage
        await tokenStorage.clearTokens();
        // Clear user from Redux
        dispatch(logout()); 
        router.replace("/(auth)"); 
      }, style: "destructive" },
    ]);
  };

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
      <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  );
}

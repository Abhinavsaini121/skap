import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import COLORS from "../../constants/colors";
import { useDeleteAccountMutation } from "../../services/authApi";
import { logout } from "../../store/authSlice";
import { tokenStorage } from "../../utils/tokenStorage";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const performLogout = async () => {
    await tokenStorage.clearTokens();
    dispatch(logout());
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" }],
    });
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount().unwrap();
              await performLogout();
            } catch (err) {
              const message =
                err?.data?.message || err?.message || "Failed to delete account.";
              Alert.alert("Error", message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("BlockedUsers")}
          >
            <Ionicons name="ban-outline" size={22} color={COLORS.textPrimary} />
            <Text style={styles.rowText}>Blocked Users</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={handleDeleteAccountPress}
            disabled={isDeleting}
          >
            <Ionicons name="trash-outline" size={22} color={COLORS.error} />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
            {isDeleting ? (
              <ActivityIndicator size="small" color={COLORS.error} style={styles.loader} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  headerRight: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
    marginLeft: 12,
  },
  deleteAccountText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.error,
    fontWeight: "500",
    marginLeft: 12,
  },
  loader: {
    marginLeft: 8,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  BackHandler,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "../../assets/styles/followersList.styles";
import COLORS from "../../constants/colors";
import { useGetBlockedUsersQuery, useUnblockUserMutation } from "../../services/userApi";

function getBlockedUsersList(data) {
  const d = data?.data;
  if (!d) return [];
  return d.blockedUsers || d.users || d.blocked || (Array.isArray(d) ? d : []);
}

export default function BlockedUsersScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();

  const { data, isLoading, error, refetch } = useGetBlockedUsersQuery();

  const blockedUsers = getBlockedUsersList(data);

  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        navigation.goBack();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [navigation]);

  const handleUnblock = (user) => {
    if (!user?._id) return;
    Alert.alert(
      "Unblock User",
      `Unblock ${user?.name || "this user"}? They will be able to see your profile again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            try {
              await unblockUser(user._id).unwrap();
              Alert.alert("Unblocked", `${user?.name || "User"} has been unblocked.`);
            } catch (err) {
              const message = err?.data?.message || err?.message || "Failed to unblock user.";
              Alert.alert("Error", message);
            }
          },
        },
      ]
    );
  };

  const handleUserPress = (userId) => {
    navigation.navigate("UserProfile", { userId });
  };

  const renderItem = ({ item }) => {
    if (!item || !item._id) return null;

    const imageSource =
      item.profileImage &&
      typeof item.profileImage === "string" &&
      item.profileImage.trim() !== "" &&
      (item.profileImage.startsWith("http://") || item.profileImage.startsWith("https://"))
        ? { uri: item.profileImage }
        : require("../../assets/images/userProfileImg.jpg");

    return (
      <View style={styles.userItem}>
        <TouchableOpacity
          style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
          onPress={() => handleUserPress(item._id)}
          activeOpacity={0.7}
        >
          <View style={styles.userImageContainer}>
            <Image
              source={imageSource}
              style={styles.userImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color={COLORS.white} />
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.name || "Unknown User"}
              </Text>
              {item.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={COLORS.primary}
                  style={styles.verifiedIcon}
                />
              )}
            </View>
            {item.bio && (
              <Text style={styles.userBio} numberOfLines={1}>
                {item.bio}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.unblockButton}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.unblockButtonText}>Unblock</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.modalContainer}>
      <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Blocked Users ({blockedUsers.length})</Text>
        <View style={{ width: 28 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading blocked users...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color={COLORS.error} />
          <Text style={styles.errorTitle}>Failed to Load Blocked Users</Text>
          <Text style={styles.errorMessage}>
            {error?.data?.message || error?.message || "Something went wrong"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : blockedUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="ban-outline" size={60} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No blocked users</Text>
          <Text style={styles.emptySubText}>
            When you block someone, they will appear here. You can unblock them anytime.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderItem}
          keyExtractor={(item) => item?._id || Math.random().toString()}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
        />
      )}
    </View>
  );
}

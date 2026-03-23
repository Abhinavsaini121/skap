import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Asset } from "expo-asset";
import { useNavigation } from "@react-navigation/native";
import { Alert, ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useDispatch } from "react-redux";
import styles from "../assets/styles/profile.styles";
import COLORS from "../constants/colors";
import { useGetProfileQuery, useDeleteAccountMutation } from "../services/authApi";
import { useGetUserFollowersQuery, useGetUserFollowingQuery } from "../services/userApi";
import { logout } from "../store/authSlice";
import { tokenStorage } from "../utils/tokenStorage";
import { BASE_URL as API_BASE_URL } from "../utils/apiConfig";

function formatMemberSince(dateInput) {
  try {
    const d = new Date(dateInput);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
  } catch {
    return "Unknown";
  }
}

const FALLBACK_PROFILE_IMAGE_URI = Asset.fromModule(require("../assets/images/icon.png")).uri;

// Helper function to get proper image source
const getImageSource = (profileImage) => {
  if (!profileImage || typeof profileImage !== 'string') {
    return { uri: FALLBACK_PROFILE_IMAGE_URI };
  }

  if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) {
    return { uri: profileImage };
  }

  const normalizedPath = profileImage.startsWith("/") ? profileImage : `/${profileImage}`;
  return { uri: `${API_BASE_URL}${normalizedPath}` };
};

export default function ProfileHeader({ onEditPress, postsCount = 0 }) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const { data: userData, isLoading, error, refetch } = useGetProfileQuery();
  
  const user = userData?.data || userData;
  const userId = user?._id;

  // Get user's following count
  const { 
    data: followingData, 
    isLoading: isFollowingLoading
  } = useGetUserFollowingQuery(
    { userId, page: 1, limit: 1 },
    { skip: !userId }
  );

  // Get user's followers count
  const { 
    data: followersData, 
    isLoading: isFollowersLoading
  } = useGetUserFollowersQuery(
    { userId, page: 1, limit: 1 },
    { skip: !userId }
  );

  const followingCount = followingData?.data?.pagination?.totalFollowing || followingData?.data?.following?.length || 0;
  const followersCount = followersData?.data?.pagination?.totalFollowers || followersData?.data?.followers?.length || 0;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        onPress: async () => { 
          await tokenStorage.clearTokens();
          dispatch(logout()); 
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        }, 
        style: "destructive" 
      },
    ]);
  };

  const performLogout = async () => {
    await tokenStorage.clearTokens();
    dispatch(logout());
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const handleDeleteAccount = () => {
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
              const message = err?.data?.message || err?.message || "Failed to delete account.";
              Alert.alert("Error", message);
            }
          },
        },
      ]
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.profileHeader}>
        <View style={styles.profileImageSection}>
          <View style={[styles.profileImage, styles.profileImageLoading]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.nameSection}>
            <Text style={styles.username}>Loading...</Text>
          </View>
          <Text style={styles.email}>Loading...</Text>
        </View>
      </View>
    );
  }


  // Show error state
  if (error) {
    return (
      <View style={styles.profileHeader}>
        <View style={styles.profileImageSection}>
          <View style={[styles.profileImage, styles.profileImageError]}>
            <Ionicons name="alert-circle" size={40} color={COLORS.error} />
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.username}>Error Loading Profile</Text>
          <Text style={styles.email}>Failed to load user data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show profile data
  if (!user) return null;

  return (
    <>
      <View style={styles.profileHeader}>
        <View style={styles.profileImageSection}>
          <Image
            source={getImageSource(user?.profileImage)}
            style={styles.profileImage}
            contentFit="cover"
          />
          
          {onEditPress && (
            <TouchableOpacity 
              style={styles.editImageButton} 
              onPress={onEditPress}
            >
              <Ionicons name="camera" size={16} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.nameSection}>
            <Text style={styles.username}>
              {user?.name || user?.username || "User"}
            </Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
              {onEditPress && (
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={onEditPress}
                >
                  <Ionicons name="pencil" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.logoutButtonSmall} 
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Stats */}
          <View style={styles.profileStats}>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatNumber}>{postsCount}</Text>
              <Text style={styles.profileStatLabel}>posts</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileStatItem}
              onPress={() => {
                if (userId) {
                  navigation.navigate('Followers', { userId });
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.profileStatNumber}>
                {isFollowersLoading ? '...' : followersCount}
              </Text>
              <Text style={styles.profileStatLabel}>followers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileStatItem}
              onPress={() => {
                if (userId) {
                  navigation.navigate('Following', { userId });
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.profileStatNumber}>
                {isFollowingLoading ? '...' : followingCount}
              </Text>
              <Text style={styles.profileStatLabel}>following</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.email}>{user?.email}</Text>
          
          {/* Phone Number */}
          {user?.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color={COLORS.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>{user?.phone}</Text>
            </View>
          )}
          
          {/* Account Status */}
          <View style={styles.infoRow}>
            <Ionicons 
              name={user?.active ? "checkmark-circle" : "close-circle"} 
              size={14} 
              color={user?.active ? COLORS.success : COLORS.error} 
              style={styles.infoIcon} 
            />
            <Text style={[styles.infoText, { color: user?.active ? COLORS.success : COLORS.error }]}>
              {user?.active ? "Account Active" : "Account Inactive"}
            </Text>
          </View>

          {/* Delete Account
          <TouchableOpacity
            style={styles.deleteAccountRow}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.error} style={styles.infoIcon} />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
            {isDeleting && <ActivityIndicator size="small" color={COLORS.error} />}
          </TouchableOpacity> */}
        </View>
      </View>


    </>
  );
}

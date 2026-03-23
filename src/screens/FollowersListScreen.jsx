import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Platform,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import styles from "../../assets/styles/followersList.styles";
import COLORS from "../../constants/colors";
import { useGetUserFollowersQuery } from "../../services/userApi";
import { selectUser } from "../../store/authSlice";

export default function FollowersListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { userId } = route.params || {};
  const currentUser = useSelector(selectUser);
  const [page, setPage] = useState(1);
  const limit = 50;
  const title = "Followers";

  // Handle hardware back button on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.goBack();
        return true; // Prevent default behavior
      });

      return () => backHandler.remove();
    }
  }, [navigation]);

  // Reset page when userId changes
  useEffect(() => {
    setPage(1);
  }, [userId]);

  const { 
    data: followersData, 
    isLoading, 
    error, 
    refetch 
  } = useGetUserFollowersQuery(
    { userId, page, limit },
    { skip: !userId }
  );

  const followers = followersData?.data?.followers || [];
  const totalFollowers = followersData?.data?.pagination?.totalFollowers || 0;

  const handleUserPress = (targetUserId) => {
    if (targetUserId && targetUserId !== currentUser?._id) {
      navigation.navigate('UserProfile', { userId: targetUserId });
    }
  };

  const renderFollowerItem = ({ item }) => {
    if (!item || !item._id) return null;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.userImageContainer}>
          <Image
            source={
              item.profileImage && 
              typeof item.profileImage === 'string' && 
              item.profileImage.trim() !== '' &&
              (item.profileImage.startsWith('http://') || item.profileImage.startsWith('https://'))
                ? { uri: item.profileImage }
                : require("../../assets/images/userProfileImg.jpg")
            }
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
              {item.name || 'Unknown User'}
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

        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={COLORS.textSecondary} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.modalContainer}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.cardBackground}
        translucent={true}
        animated={true}
      />
      
      {/* Header */}
      <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>
          {title} ({totalFollowers})
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {isLoading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading {title.toLowerCase()}...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color={COLORS.error} />
          <Text style={styles.errorTitle}>Failed to Load {title}</Text>
          <Text style={styles.errorMessage}>
            {error?.data?.message || error?.message || "Something went wrong"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : followers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No {title.toLowerCase()} yet</Text>
          <Text style={styles.emptySubText}>
            {title === "Followers" 
              ? "This user doesn't have any followers yet"
              : "This user isn't following anyone yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={followers}
          renderItem={renderFollowerItem}
          keyExtractor={(item) => item?._id || Math.random().toString()}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
          onEndReached={() => {
            if (followers.length < totalFollowers && !isLoading) {
              setPage(prev => prev + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            followers.length < totalFollowers && isLoading ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}


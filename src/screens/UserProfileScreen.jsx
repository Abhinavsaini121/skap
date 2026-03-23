
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Share,
  Dimensions,
  Platform,
  Animated,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "../../assets/styles/userProfile.styles";
import COLORS from "../../constants/colors";
import { useSelector, useDispatch } from "react-redux";
import { useGetReelsByUserQuery } from "../../services/reelsApi";
import { useGetUserProfileQuery, useGetUserFollowingQuery, useGetUserFollowersQuery, useBlockUserMutation, useUnblockUserMutation } from "../../services/userApi";
import { useDeleteAccountMutation } from "../../services/authApi";
import { selectUser, logout } from "../../store/authSlice";
import { tokenStorage } from "../../utils/tokenStorage";
import ProfileGridItem from "../components/ProfileGridItem";
import UserProfileHeader from "../components/UserProfileHeader";


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 2) / 3;

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { userId } = route.params || {};
  const insets = useSafeAreaInsets();
  const currentUser = useSelector(selectUser);
  const [deleteAccount] = useDeleteAccountMutation();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'reels', 'tagged'
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const [blockUser, { isLoading: isBlocking }] = useBlockUserMutation();
  const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();

  // Animated values for header
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

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

  // Header animation thresholds
  const HEADER_SCROLL_THRESHOLD = 100;

  // Memoized animated header values for better performance
  const headerOpacity = useMemo(() => scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  }), [scrollY]);

  const headerBackgroundOpacity = useMemo(() => scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_THRESHOLD * 0.8],
    outputRange: [0.1, 0.95],
    extrapolate: 'clamp',
  }), [scrollY]);

  const headerTitleOpacity = useMemo(() => scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_THRESHOLD * 0.6],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  }), [scrollY]);

  // Validate userId
  const isValidUserId = userId && userId !== 'undefined' && userId !== 'null';

  // Get user profile
  const { 
    data: userProfileData, 
    isLoading: isLoadingProfile, 
    error: profileError,
    refetch: refetchProfile 
  } = useGetUserProfileQuery(userId, {
    skip: !isValidUserId
  });

  // Sync isBlocked from API when profile loads (if API returns isBlockedByMe)
  useEffect(() => {
    const blocked = userProfileData?.data?.isBlockedByMe;
    if (typeof blocked === 'boolean') {
      setIsBlocked(blocked);
    }
  }, [userProfileData?.data?.isBlockedByMe]);

  // Get user's reels with polling for real-time view count updates
  const { 
    data: reelsData, 
    isLoading: isReelsLoading, 
    error: reelsError, 
    refetch: refetchReels 
  } = useGetReelsByUserQuery(
    { userId, page: 1, limit: 50 },
    { 
      skip: !isValidUserId,
      pollingInterval: 10000, // Poll every 10 seconds for real-time view count updates
      refetchOnMountOrArgChange: true,
    }
  );

  // Get user's following count
  const { 
    data: followingData, 
    isLoading: isFollowingLoading, 
    refetch: refetchFollowing 
  } = useGetUserFollowingQuery(
    { userId, page: 1, limit: 1 },
    { skip: !isValidUserId }
  );

  // Get user's followers count
  const { 
    data: followersData, 
    isLoading: isFollowersLoading, 
    refetch: refetchFollowers 
  } = useGetUserFollowersQuery(
    { userId, page: 1, limit: 1 },
    { skip: !isValidUserId }
  );

  const reels = reelsData?.data?.reels || [];
  const userProfile = userProfileData?.data;
  const totalReels = reelsData?.data?.total || 0;
  const postsCount = totalReels;
  const followingCount = followingData?.data?.pagination?.totalFollowing || followingData?.data?.following?.length || 0;
  const followersCount = followersData?.data?.pagination?.totalFollowers || followersData?.data?.followers?.length || 0;

  // Create mock profile from reel data ONLY if profile API fails and we have reel data
  const mockProfile = useMemo(() => {
    // Only create mock profile if profile API failed and we have reel data
    if (profileError && !userProfile && reels && reels.length > 0 && reels[0].userId) {
      const user = reels[0].userId;
      return {
        _id: user._id,
        name: user.name,
        profileImage: user.profileImage,
        bio: user.bio || 'Digital creator',
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified || false,
        website: user.website,
      };
    }
    return null;
  }, [profileError, userProfile, reels]);

  // Determine if we're still loading - show loader until APIs complete
  const isLoading = (isLoadingProfile || isReelsLoading || isFollowingLoading || isFollowersLoading) && !refreshing;
  
  // Final profile to use (API data takes priority over mock)
  const finalProfile = userProfile || mockProfile;
  const finalProfileId = finalProfile?._id || userId;


  // Handle share profile - memoized
  const handleShareProfile = useCallback(async () => {
    try {
      const shareUrl = `myapp://user/${userId}`;
      const shareMessage = `Check out ${finalProfile?.name || 'this user'}'s profile!`;
      
      await Share.share({
        message: shareMessage,
        url: shareUrl,
        title: `${finalProfile?.name || 'User'} Profile`
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share profile');
    }
  }, [userId, finalProfile?.name]);

  // Refresh handler - memoized
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProfile(),
        refetchReels(),
        refetchFollowing(),
        refetchFollowers()
      ]);
    } catch (error) {
      // Silently handle refresh errors
    } finally {
      setRefreshing(false);
    }
  }, [refetchProfile, refetchReels, refetchFollowing, refetchFollowers]);

  // Format reels data for grid
  const gridData = useMemo(() => {
    if (!reels || reels.length === 0) return [];
    return reels;
  }, [reels]);

  // List data for FlatList - optimized
  const listData = useMemo(() => {
    if (gridData.length === 0) return [];

    // Flatten grid data into rows of 3 items
    const rows = [];
    for (let i = 0; i < gridData.length; i += 3) {
      rows.push({
        id: `row-${i}`,
        items: gridData.slice(i, i + 3),
        rowIndex: Math.floor(i / 3)
      });
    }
    return rows;
  }, [gridData]);

  // Memoized FlatList optimizations
  const keyExtractor = useCallback((item) => item.id, []);
  
  const getItemLayout = useCallback((data, index) => ({
    length: GRID_ITEM_SIZE,
    offset: GRID_ITEM_SIZE * index,
    index,
  }), []);

  const scrollHandler = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
    }
  ), [scrollY]);

  const contentContainerStyle = useMemo(() => [
    styles.listContent,
    { paddingTop: insets.top + 62 }
  ], [insets.top]);

  // Optimized navigation handlers
  const handleFollowersPress = useCallback(() => {
    if (finalProfileId) {
      navigation.navigate('Followers', { userId: finalProfileId });
    }
  }, [navigation, finalProfileId]);

  const handleFollowingPress = useCallback(() => {
    if (finalProfileId) {
      navigation.navigate('Following', { userId: finalProfileId });
    }
  }, [navigation, finalProfileId]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const isOwnProfile = currentUser?._id && finalProfileId && currentUser._id === finalProfileId;

  const handleDeleteAccount = useCallback(() => {
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
              await tokenStorage.clearTokens();
              dispatch(logout());
              navigation.reset({
                index: 0,
                routes: [{ name: "Auth" }],
              });
            } catch (err) {
              const message = err?.data?.message || err?.message || "Failed to delete account.";
              Alert.alert("Error", message);
            }
          },
        },
      ]
    );
  }, [deleteAccount, dispatch, navigation]);

  const handleBlockUser = useCallback(() => {
    if (!finalProfileId) return;
    Alert.alert(
      "Block User",
      `Block ${finalProfile?.name || "this user"}? They won't be able to see your profile or contact you.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              setShowOptionsMenu(false);
              await blockUser(finalProfileId).unwrap();
              setIsBlocked(true);
              Alert.alert("Blocked", `${finalProfile?.name || "User"} has been blocked.`, [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              const message = err?.data?.message || err?.message || "Failed to block user.";
              Alert.alert("Error", message);
            }
          },
        },
      ]
    );
  }, [finalProfileId, finalProfile?.name, blockUser, navigation]);

  const handleUnblockUser = useCallback(() => {
    if (!finalProfileId) return;
    Alert.alert(
      "Unblock User",
      `Unblock ${finalProfile?.name || "this user"}? They will be able to see your profile again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            try {
              setShowOptionsMenu(false);
              await unblockUser(finalProfileId).unwrap();
              setIsBlocked(false);
              Alert.alert("Unblocked", `${finalProfile?.name || "User"} has been unblocked.`);
            } catch (err) {
              const message = err?.data?.message || err?.message || "Failed to unblock user.";
              Alert.alert("Error", message);
            }
          },
        },
      ]
    );
  }, [finalProfileId, finalProfile?.name, unblockUser]);

  // Render profile header with tabs - optimized
  const renderProfileHeader = useCallback(() => (
    <UserProfileHeader
      profile={finalProfile}
      postsCount={postsCount}
      followersCount={followersCount}
      followingCount={followingCount}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onFollowersPress={handleFollowersPress}
      onFollowingPress={handleFollowingPress}
      isOwnProfile={isOwnProfile}
      onDeleteAccount={handleDeleteAccount}
    />
  ), [finalProfile, postsCount, followersCount, followingCount, activeTab, handleTabChange, handleFollowersPress, handleFollowingPress, isOwnProfile, handleDeleteAccount]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    const emptyConfig = {
      posts: {
        icon: 'grid-outline',
        title: 'No posts yet',
        message: `When ${finalProfile?.name || 'this user'} shares posts, they'll appear here`
      },
      reels: {
        icon: 'videocam-outline',
        title: 'No reels yet',
        message: `When ${finalProfile?.name || 'this user'} creates reels, they'll appear here`
      },
      tagged: {
        icon: 'person-outline',
        title: 'No tagged posts',
        message: `Posts that ${finalProfile?.name || 'this user'} is tagged in will appear here`
      }
    };

    const config = emptyConfig[activeTab] || emptyConfig.posts;

    return (
      <View style={styles.emptyState}>
        <Ionicons name={config.icon} size={50} color={COLORS.textSecondary} />
        <Text style={styles.emptyStateText}>{config.title}</Text>
        <Text style={[styles.emptyStateText, { fontSize: 14, marginTop: 8, opacity: 0.7 }]}>
          {config.message}
        </Text>
      </View>
    );
  }, [activeTab, finalProfile?.name]);

  // Optimized reel press handler
  const handleReelPress = useCallback((reelId) => {
    const params = { reelId };
    if (finalProfileId) {
      params.userId = finalProfileId;
    }
    navigation.navigate('Main', {
      screen: 'Home',
      params,
    });
  }, [navigation, finalProfileId]);

  // Render grid row - optimized
  const renderGridRow = useCallback(({ item }) => {
    if (item.items.length === 0) return null;

    return (
      <View style={styles.gridRow}>
        {item.items.map((reel, index) => (
          <ProfileGridItem
            key={reel._id}
            item={reel}
            index={item.rowIndex * 3 + index}
            showPinned={activeTab === 'posts'}
            onPress={() => handleReelPress(reel._id)}
          />
        ))}
        {/* Fill empty spaces if row is incomplete */}
        {Array.from({ length: 3 - item.items.length }).map((_, idx) => (
          <View key={`empty-${idx}`} style={styles.postItem} />
        ))}
      </View>
    );
  }, [activeTab, handleReelPress]);

  // Check if userId is valid
  if (!isValidUserId) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={60} color={COLORS.textSecondary} />
        <Text style={styles.errorTitle}>Invalid User</Text>
        <Text style={styles.errorMessage}>
          No user ID provided or invalid user ID.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading until BOTH APIs complete
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Show error only if profile API failed and we have no profile data (including mock)
  if (profileError && !finalProfile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={60} color={COLORS.textSecondary} />
        <Text style={styles.errorTitle}>Profile Not Found</Text>
        <Text style={styles.errorMessage}>
          {profileError?.data?.message || profileError?.message || 'This user profile could not be found.'}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Safety check: If we still don't have a profile after loading, show error
  if (!finalProfile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={60} color={COLORS.textSecondary} />
        <Text style={styles.errorTitle}>Profile Not Found</Text>
        <Text style={styles.errorMessage}>
          This user profile could not be found.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
        animated={true}
        hidden={false}
      />

      {/* Fixed Header (Always Visible) - Modern Design */}
      <View
        style={[
          styles.fixedHeader,
          { paddingTop: insets.top + 8 }
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.modernHeaderButton}>
              <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.modernHeaderTitle} numberOfLines={1}>
              {finalProfile.name}
            </Text>
            {finalProfile.isVerified && (
              <View style={styles.modernVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#4A90E2" />
              </View>
            )}
          </View>

          {!isOwnProfile ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowOptionsMenu(true)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <View style={styles.modernHeaderButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButtonPlaceholder} />
          )}
        </View>
      </View>

      {/* Options menu modal (Block, Unblock, Report) - Instagram style */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.optionsMenuOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsMenuCard}>
            {isBlocked ? (
              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={handleUnblockUser}
                disabled={isUnblocking}
              >
                <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.primary} />
                <Text style={styles.optionsMenuText}>Unblock</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={handleBlockUser}
                disabled={isBlocking}
              >
                <Ionicons name="ban-outline" size={22} color={COLORS.error} />
                <Text style={[styles.optionsMenuText, { color: COLORS.error }]}>Block</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.optionsMenuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                navigation.navigate('ReportUser', {
                  reportedUserId: finalProfileId,
                  reportedUserName: finalProfile?.name,
                });
              }}
            >
              <Ionicons name="flag-outline" size={22} color={COLORS.error} />
              <Text style={styles.optionsMenuText}>Report</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Animated Sticky Header (Fades in on scroll) */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            opacity: headerOpacity,
          }
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.headerGradient,
            {
              opacity: headerBackgroundOpacity,
            }
          ]}
        />
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: headerOpacity,
            }
          ]}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <View style={styles.modernHeaderButton}>
              <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.headerTitleContainer,
              {
                opacity: headerTitleOpacity,
              }
            ]}
          >
            <Text style={styles.modernHeaderTitle} numberOfLines={1}>
              {finalProfile.name}
            </Text>
            {finalProfile.isVerified && (
              <View style={styles.modernVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#4A90E2" />
              </View>
            )}
          </Animated.View>

          {!isOwnProfile ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowOptionsMenu(true)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <View style={styles.modernHeaderButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButtonPlaceholder} />
          )}
        </Animated.View>
      </Animated.View>

      {/* Main Content */}
      {activeTab === 'tagged' ? (
        <FlatList
          ref={flatListRef}
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={renderProfileHeader}
          ListEmptyComponent={renderEmptyState}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={activeTab === 'posts' || activeTab === 'reels' ? listData : []}
          renderItem={renderGridRow}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderProfileHeader}
          ListFooterComponent={gridData.length === 0 ? renderEmptyState : null}
          ListEmptyComponent={renderEmptyState}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          initialNumToRender={5}
          windowSize={5}
          getItemLayout={getItemLayout}
        />
      )}


    </View>
  );
}

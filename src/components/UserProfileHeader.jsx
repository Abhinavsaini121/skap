import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import styles from '../../assets/styles/userProfile.styles';
import COLORS from '../../constants/colors';

// Helper function to format member since date
function formatMemberSince(dateInput) {
  try {
    const d = new Date(dateInput);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
  } catch {
    return "Unknown";
  }
}

// Helper function to safely get profile image source
function getProfileImageSource(profileImage) {
  try {
    if (profileImage != null && typeof profileImage === 'string' && profileImage.trim() !== '' && (profileImage.startsWith('http://') || profileImage.startsWith('https://'))) {
      return { uri: profileImage };
    }
  } catch (error) {
    // Fall back to default image
  }
  return require('../../assets/images/userProfileImg.jpg');
}

const UserProfileHeader = memo(({
  profile,
  postsCount,
  followersCount,
  followingCount,
  activeTab,
  onTabChange,
  onFollowersPress,
  onFollowingPress,
  isOwnProfile,
  onDeleteAccount,
}) => {
  if (!profile) return null;

  return (
    <>
      <View style={styles.profileInfoSection}>
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileImageSection}>
            <Image
              source={getProfileImageSource(profile.profileImage)}
              style={styles.profileHeaderImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
            {profile.isVerified && (
              <View style={styles.profileHeaderVerifiedBadge}>
                <Ionicons name="checkmark" size={12} color={COLORS.white} />
              </View>
            )}
          </View>

          <View style={styles.profileHeaderInfo}>
            <View style={styles.profileHeaderNameSection}>
              <Text style={styles.profileHeaderUsername}>
                {profile.name}
              </Text>
            </View>

            <View style={styles.profileHeaderStats}>
              <View style={styles.profileHeaderStatItem}>
                <Text style={styles.profileHeaderStatNumber}>{postsCount}</Text>
                <Text style={styles.profileHeaderStatLabel}>posts</Text>
              </View>
              <TouchableOpacity 
                style={styles.profileHeaderStatItem}
                onPress={onFollowersPress}
                activeOpacity={0.7}
              >
                <Text style={styles.profileHeaderStatNumber}>{followersCount}</Text>
                <Text style={styles.profileHeaderStatLabel}>followers</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.profileHeaderStatItem}
                onPress={onFollowingPress}
                activeOpacity={0.7}
              >
                <Text style={styles.profileHeaderStatNumber}>{followingCount}</Text>
                <Text style={styles.profileHeaderStatLabel}>following</Text>
              </TouchableOpacity>
            </View>

            {profile.email && (
              <Text style={styles.profileHeaderEmail}>{profile.email}</Text>
            )}

            {profile.phone && (
              <View style={styles.profileHeaderInfoRow}>
                <Ionicons name="call-outline" size={14} color={COLORS.textSecondary} style={styles.profileHeaderInfoIcon} />
                <Text style={styles.profileHeaderInfoText}>{profile.phone}</Text>
              </View>
            )}

            {profile.bio && (
              <Text style={styles.profileHeaderBio}>{profile.bio}</Text>
            )}

            {profile.website && (
              <TouchableOpacity
                style={styles.profileHeaderLink}
                onPress={() => Linking.openURL(profile.website)}
              >
                <Ionicons name="link" size={14} color={COLORS.primary} style={styles.profileHeaderInfoIcon} />
                <Text style={styles.profileHeaderLinkText}>{profile.website}</Text>
              </TouchableOpacity>
            )}

            {profile.createdAt && (
              <Text style={styles.profileHeaderMemberSince}>
                🗓️ Joined {formatMemberSince(profile.createdAt)}
              </Text>
            )}

            {isOwnProfile && onDeleteAccount && (
              <TouchableOpacity
                style={styles.deleteAccountButton}
                onPress={onDeleteAccount}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'posts' && styles.activeTabButton]}
          onPress={() => onTabChange('posts')}
        >
          <Ionicons
            name="grid"
            size={22}
            color={activeTab === 'posts' ? COLORS.white : COLORS.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'reels' && styles.activeTabButton]}
          onPress={() => onTabChange('reels')}
        >
          <Ionicons
            name="play"
            size={22}
            color={activeTab === 'reels' ? COLORS.white : COLORS.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'tagged' && styles.activeTabButton]}
          onPress={() => onTabChange('tagged')}
        >
          <Ionicons
            name="person"
            size={22}
            color={activeTab === 'tagged' ? COLORS.white : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.profile?._id === nextProps.profile?._id &&
    prevProps.profile?.name === nextProps.profile?.name &&
    prevProps.profile?.profileImage === nextProps.profile?.profileImage &&
    prevProps.profile?.email === nextProps.profile?.email &&
    prevProps.profile?.phone === nextProps.profile?.phone &&
    prevProps.profile?.bio === nextProps.profile?.bio &&
    prevProps.profile?.website === nextProps.profile?.website &&
    prevProps.profile?.isVerified === nextProps.profile?.isVerified &&
    prevProps.postsCount === nextProps.postsCount &&
    prevProps.followersCount === nextProps.followersCount &&
    prevProps.followingCount === nextProps.followingCount &&
    prevProps.activeTab === nextProps.activeTab &&
    prevProps.isOwnProfile === nextProps.isOwnProfile
  );
});

UserProfileHeader.displayName = 'UserProfileHeader';

export default UserProfileHeader;


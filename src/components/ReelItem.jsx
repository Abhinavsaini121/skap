import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Dimensions } from 'react-native';
import styles from '../../assets/styles/home.styles';
import COLORS from '../../constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

// Video Fallback Component
const VideoFallback = memo(({ onRetry }) => (
  <View style={styles.videoFallback}>
    <Ionicons name="videocam-off" size={60} color={COLORS.textSecondary} />
    <Text style={styles.videoFallbackTitle}>Video Unavailable</Text>
    <Text style={styles.videoFallbackMessage}>
      This video could not be loaded. Please try again later.
    </Text>
    <TouchableOpacity style={styles.videoRetryButton} onPress={onRetry}>
      <Text style={styles.videoRetryButtonText}>Retry</Text>
    </TouchableOpacity>
  </View>
));

VideoFallback.displayName = 'VideoFallback';

const ReelItem = memo(({
  item,
  index,
  isLiked,
  likeCount,
  commentCount,
  isPlaying,
  isAudioOn,
  isVideoError,
  isFollowing,
  isOwnProfile,
  isLoadingFollow,
  isLikeLoading,
  isCurrentVideo,
  trackedViews,
  onLike,
  onComment,
  onShare,
  onFollowToggle,
  onVideoPress,
  onAudioToggle,
  onUserProfilePress,
  onVideoError,
  onVideoLoadStart,
  onVideoLoad,
  onPlaybackStatusUpdate,
  onRetryVideo,
  onVideoRef,
  globalAudioOn,
}) => {
  const getVideoUrl = (item) => {
    if (item.videoUrl && item.videoUrl.startsWith('http')) {
      return item.videoUrl;
    }
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  };

  return (
    <View style={styles.reelContainer}>
      <View style={styles.videoContainer}>
        <TouchableOpacity 
          style={styles.videoTouchable} 
          onPress={() => onVideoPress(item._id)}
          activeOpacity={1}
        >
          {isVideoError ? (
            <VideoFallback onRetry={() => onRetryVideo(item._id)} />
          ) : (
            <Video
              ref={onVideoRef}
              source={{ uri: getVideoUrl(item) }}
              style={styles.video}
              useNativeControls={false}
              resizeMode={ResizeMode?.COVER || "cover"}
              isLooping={isPlaying}
              shouldPlay={isPlaying}
              isPaused={!isPlaying}
              rate={isPlaying ? 1 : 0}
              isMuted={!isAudioOn}
              onError={onVideoError}
              onLoadStart={onVideoLoadStart}
              onLoad={onVideoLoad}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            />
          )}
          
          <View style={styles.videoControlsOverlay}>
            {!isPlaying && (
              <TouchableOpacity 
                style={styles.playPauseButton}
                onPress={() => onVideoPress(item._id)}
              >
                <Ionicons name="play" size={40} color={COLORS.white} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.audioButton}
              onPress={() => onAudioToggle(item._id)}
            >
              <Ionicons 
                name={globalAudioOn ? "volume-high" : "volume-mute"} 
                size={20} 
                color={COLORS.white} 
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        
        <View style={styles.videoOverlay}>
          <View style={styles.rightActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => onLike(item._id)}
              disabled={isLikeLoading}
            >
              {isLikeLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={28} 
                  color={isLiked ? COLORS.error : COLORS.white} 
                />
              )}
              <Text style={styles.actionText}>{likeCount || 0}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => onComment(item._id)}
            >
              <Ionicons name="chatbubble-outline" size={28} color={COLORS.white} />
              <Text style={styles.actionText}>{commentCount || 0}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onShare(item)}
            >
              <Ionicons name="share-outline" size={28} color={COLORS.white} />
              <Text style={styles.actionText}>{item.shares || 0}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.bottomInfo}>
            <View style={styles.userInfo}>
              <TouchableOpacity 
                style={styles.userInfoTouchable}
                onPress={() => onUserProfilePress(item.userId?._id)}
                activeOpacity={0.7}
              >
                <Image 
                  source={getProfileImageSource(item?.userId?.profileImage)}
                  style={styles.userAvatar} 
                  defaultSource={require('../../assets/images/userProfileImg.jpg')}
                />
                <Text style={styles.username} numberOfLines={1}>
                  {item.userId?.name || "User"}
                </Text>
              </TouchableOpacity>
              {!isOwnProfile && (
                <TouchableOpacity 
                  style={[
                    styles.followButton,
                    isFollowing && styles.followingButton
                  ]}
                  onPress={() => item.userId?._id && onFollowToggle(item.userId._id)}
                  disabled={isLoadingFollow}
                  activeOpacity={0.8}
                >
                  {isLoadingFollow ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={[
                      styles.followButtonText,
                      isFollowing && styles.followingButtonText
                    ]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
            
            <View style={{ 
              backgroundColor: '#000000', 
              paddingHorizontal: 16, 
              paddingVertical: 8, 
              marginTop: 8, 
              marginLeft: -16, 
              marginRight: -80,
              width: screenWidth
            }}>
              <Text style={styles.caption} numberOfLines={2}>
                {item.caption || "No caption"}
              </Text>
            </View>
            
            <View style={styles.musicInfo}>
              <Ionicons name="musical-notes" size={16} color={COLORS.white} />
              <Text style={styles.musicText}>Original Audio</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.item._id === nextProps.item._id &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.likeCount === nextProps.likeCount &&
    prevProps.commentCount === nextProps.commentCount &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.isAudioOn === nextProps.isAudioOn &&
    prevProps.isVideoError === nextProps.isVideoError &&
    prevProps.isFollowing === nextProps.isFollowing &&
    prevProps.isOwnProfile === nextProps.isOwnProfile &&
    prevProps.isLoadingFollow === nextProps.isLoadingFollow &&
    prevProps.isLikeLoading === nextProps.isLikeLoading &&
    prevProps.isCurrentVideo === nextProps.isCurrentVideo &&
    prevProps.globalAudioOn === nextProps.globalAudioOn &&
    prevProps.index === nextProps.index
  );
});

ReelItem.displayName = 'ReelItem';

export default ReelItem;


import React, { memo, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView, Linking, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const AdvertisementItem = memo(({
  item,
  index,
  isLiked,
  likeCount,
  commentCount,
  isAdvertisementLikeLoading,
  currentBannerIndex,
  onLike,
  onComment,
  onShare,
  onUserProfilePress,
  onBannerScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onBannerScrollRef,
}) => {
  return (
    <View style={styles.adContainer}>
      <View style={styles.adBanner}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        
        <View style={styles.adLogoContainer}>
          {item.companyLogo ? (
            <Image 
              source={{ uri: item.companyLogo }} 
              style={styles.adLogo}
              resizeMode="contain"
              onError={() => {}}
              defaultSource={require('../../assets/images/userProfileImg.jpg')}
            />
          ) : (
            <View style={styles.adLogo}>
              <Ionicons name="bag" size={24} color={COLORS.white} />
            </View>
          )}
          <Text style={styles.adBrandName}>{item.companyName}</Text>
        </View>
        
        {item.bannerUrl && item.bannerUrl.length > 0 ? (
          <View style={styles.adBannerContainer}>
            <ScrollView
              ref={onBannerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.adBannerScrollView}
              contentContainerStyle={{ 
                width: screenWidth * item.bannerUrl.length,
                height: (screenHeight - 150) / 2 
              }}
              scrollEventThrottle={16}
              onScroll={onBannerScroll}
              onScrollBeginDrag={onScrollBeginDrag}
              onScrollEndDrag={onScrollEndDrag}
              onMomentumScrollEnd={(event) => {
                const scrollX = event.nativeEvent.contentOffset.x;
                const currentIndex = Math.round(scrollX / screenWidth);
                onBannerScroll(event);
              }}
            >
              {item.bannerUrl.map((bannerImage, bannerIndex) => (
                <View key={bannerIndex} style={styles.adBannerImageContainer}>
                  <Image 
                    source={{ uri: bannerImage }} 
                    style={styles.adBannerImage}
                    onError={() => {}}
                    defaultSource={require('../../assets/images/userProfileImg.jpg')}
                  />
                </View>
              ))}
            </ScrollView>
            
            {item.bannerUrl.length >= 1 && (
              <View style={styles.adPaginationContainer}>
                {item.bannerUrl.map((_, indicatorIndex) => (
                  <View
                    key={indicatorIndex}
                    style={[
                      styles.adPaginationDot,
                      indicatorIndex === currentBannerIndex && styles.adPaginationDotActive
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.adBannerImageContainer}>
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#0f3460',
            }}>
              <Text style={{ 
                color: COLORS.white, 
                fontSize: 18, 
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: 20,
              }}>
                {item.companyName || "Advertisement"}
              </Text>
              <Text style={{ 
                color: COLORS.white, 
                fontSize: 14, 
                textAlign: 'center',
                opacity: 0.8,
              }}>
                {item.advertisementDescription || "Special Offers Available"}
              </Text>
            </View>
            
            <View style={styles.adPaginationContainer}>
              <View style={[styles.adPaginationDot, styles.adPaginationDotActive]} />
            </View>
          </View>
        )}

        {item.userId && (
          <View style={styles.adUserInfo}>
            <TouchableOpacity 
              style={styles.adUserInfoTouchable}
              onPress={() => onUserProfilePress(item.userId._id)}
              activeOpacity={0.7}
            >
              <Image 
                source={getProfileImageSource(item?.userId?.profileImage)}
                style={styles.adUserAvatar}
                resizeMode="cover"
                defaultSource={require('../../assets/images/userProfileImg.jpg')}
              />
              <Text style={styles.adUsername}>{item?.userId?.name || "User"}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.adBottomSection}>
          <TouchableOpacity 
            style={styles.adCTAButton}
            onPress={() => {
              if (item.link) {
                Linking.openURL(item.link).catch(err => {});
              }
            }}
          >
            <Text style={styles.adCTAButtonText}>{item.linkTitle || "Install now"}</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.adOfferText}>
            {item.advertisementDescription || "No description available"}
          </Text>
        </View>
        
        <View style={styles.adRightActions}>
          <TouchableOpacity 
            style={styles.adActionButton}
            onPress={() => onLike(item._id)}
            disabled={isAdvertisementLikeLoading}
          >
            {isAdvertisementLikeLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={28} 
                color={isLiked ? COLORS.error : COLORS.white} 
              />
            )}
            <Text style={styles.adActionText}>{likeCount || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.adActionButton}
            onPress={() => onComment(item._id)}
          >
            <Ionicons name="chatbubble-outline" size={28} color={COLORS.white} />
            <Text style={styles.adActionText}>{commentCount || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.adActionButton}
            onPress={() => onShare(item)}
          >
            <Ionicons name="share-outline" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.item._id === nextProps.item._id &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.likeCount === nextProps.likeCount &&
    prevProps.commentCount === nextProps.commentCount &&
    prevProps.isAdvertisementLikeLoading === nextProps.isAdvertisementLikeLoading &&
    prevProps.currentBannerIndex === nextProps.currentBannerIndex &&
    prevProps.index === nextProps.index
  );
});

AdvertisementItem.displayName = 'AdvertisementItem';

export default AdvertisementItem;


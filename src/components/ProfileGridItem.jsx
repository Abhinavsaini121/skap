import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import styles from '../../assets/styles/userProfile.styles';
import COLORS from '../../constants/colors';

// Helper function to format view count (e.g., 1200 -> "1.2K", 1500000 -> "1.5M")
function formatViewCount(count) {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
}

const ProfileGridItem = memo(({ item, index, onPress, showPinned }) => {
  return (
    <TouchableOpacity 
      style={styles.postItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.videoUrl }}
        style={styles.postImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
      />
      <View style={styles.postOverlay}>
        <Ionicons name="play" size={12} color={COLORS.white} />
      </View>
      {/* Views Count */}
      <View style={styles.postViewsOverlay}>
        <Ionicons name="eye" size={16} color={COLORS.white} />
        <Text style={styles.postViewsText}>
          {formatViewCount(item.views || 0)}
        </Text>
      </View>
      {showPinned && index === 0 && (
        <View style={styles.pinnedPost}>
          <Ionicons name="bookmark" size={10} color={COLORS.white} />
        </View>
      )}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.item._id === nextProps.item._id &&
    prevProps.item.videoUrl === nextProps.item.videoUrl &&
    prevProps.item.views === nextProps.item.views &&
    prevProps.index === nextProps.index &&
    prevProps.showPinned === nextProps.showPinned
  );
});

ProfileGridItem.displayName = 'ProfileGridItem';

export default ProfileGridItem;


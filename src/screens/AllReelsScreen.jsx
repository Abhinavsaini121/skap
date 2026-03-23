import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "../../assets/styles/allReels.styles";
import COLORS from "../../constants/colors";
import { useDeleteReelMutation, useGetReelsByUserQuery } from "../../services/reelsApi";
import { selectUser } from "../../store/authSlice";

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

export default function AllReelsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useSelector(selectUser);
  const [deleteReelId, setDeleteReelId] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [showAutoPlayNotification, setShowAutoPlayNotification] = useState(false);

  const { 
    data: reelsData, 
    isLoading, 
    error, 
    refetch 
  } = useGetReelsByUserQuery(
    { userId: user?._id, page: 1, limit: 50 },
    { skip: !user?._id }
  );

  const [deleteReel, { isLoading: isDeleting }] = useDeleteReelMutation();

  const reels = reelsData?.data?.reels || [];
  const totalReels = reelsData?.data?.total || 0;

  const handleVideoPress = (reel) => {
    setSelectedVideo(reel);
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const handleDeleteReel = async (reelId) => {
    try {
      setDeleteReelId(reelId);
      await deleteReel(reelId).unwrap();
      Alert.alert("Success", "Reel deleted successfully");
      // Close video modal if the deleted reel is currently being played
      if (selectedVideo?._id === reelId) {
        closeVideoModal();
      }
    } catch (error) {
      Alert.alert("Error", error?.data?.message || "Failed to delete reel");
    } finally {
      setDeleteReelId(null);
    }
  };

  const confirmDelete = (reelId) => {
    Alert.alert("Delete Reel", "Are you sure you want to delete this reel?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDeleteReel(reelId) },
    ]);
  };

  const renderReelItem = ({ item }) => (

    <View style={styles.reelItem}>
      <TouchableOpacity onPress={() => handleVideoPress(item)}>
        <Image source={{ uri: item?.videoUrl }} style={styles.reelVideo} />
        <View style={styles.playOverlay}>
          <Ionicons name="play-circle" size={24} color={COLORS.white} />
        </View>
      </TouchableOpacity>
      <View style={styles.reelInfo}>
        <Text style={styles.reelCaption} numberOfLines={2}>
          {item?.caption || "No caption"}
        </Text>
        <View style={styles.reelStats}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={16} color={COLORS.primary} />
            <Text style={styles.statText}>{item?.likes?.length || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.statText}>
              {item?.commentsCount || 0}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.statText}>
              {formatViewCount(item?.views || 0)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.statText}>
              {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item?._id)}>
        {deleteReelId === item?._id && isDeleting ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.cardBackground}
        translucent={true}
        animated={true}
      />
      
      {/* Header */}
      <View style={[styles.screenHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Your Reels ({totalReels})</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading reels...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color={COLORS.error} />
          <Text style={styles.errorTitle}>Failed to Load Reels</Text>
          <Text style={styles.errorMessage}>
            {error?.data?.message || error?.message || "Something went wrong"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : reels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={60} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No reels yet</Text>
          <Text style={styles.emptySubText}>
            Create your first reel to get started
          </Text>
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={() => {
              navigation.navigate('Create');
            }}
          >
            <Text style={styles.createButtonText}>Create Your First Reel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reels}
          renderItem={renderReelItem}
          keyExtractor={(item) => item?._id}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
        />
      )}

      {/* Video Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        transparent={false}
        onRequestClose={closeVideoModal}
      >
        <View style={styles.videoModalContainer}>
          {isVideoLoading && (
            <View style={styles.videoLoadingContainer}>
              <ActivityIndicator size="large" color={COLORS.white} />
              <Text style={styles.videoLoadingText}>Loading video...</Text>
            </View>
          )}

          {/* Auto-play notification */}
          {!isVideoLoading && isVideoPlaying && showAutoPlayNotification && (
            <View style={styles.autoPlayNotification}>
              <Text style={styles.autoPlayText}>Auto-playing...</Text>
            </View>
          )}

          <Video
            style={styles.videoPlayer}
            source={{ uri: selectedVideo?.videoUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay={isVideoPlaying}
            isMuted={false}
            onLoadStart={() => setIsVideoLoading(true)}
            onLoad={() => {
              setIsVideoLoading(false);
              setIsVideoPlaying(true); // Auto-play when video loads
              setShowAutoPlayNotification(true);
              // Hide notification after 3 seconds
              setTimeout(() => setShowAutoPlayNotification(false), 3000);
            }}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded) {
                setIsVideoPlaying(status.isPlaying);
              }
            }}
            onError={(error) => {
              setIsVideoLoading(false);
              setIsVideoPlaying(false);
              Alert.alert("Error", "Failed to load video");
            }}
          />

          {/* Play/Pause Overlay Button */}
          {!isVideoLoading && (
            <TouchableOpacity
              style={styles.playPauseOverlay}
              onPress={() => setIsVideoPlaying(!isVideoPlaying)}
            >
              <Ionicons
                name={isVideoPlaying ? "pause-circle" : "play-circle"}
                size={80}
                color={COLORS.white}
              />
            </TouchableOpacity>
          )}

          {selectedVideo?.caption && (
            <View style={styles.videoCaptionContainer}>
              <Text style={styles.videoCaptionText}>{selectedVideo?.caption}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.closeVideoButton} onPress={closeVideoModal}>
            <Ionicons name="close" size={30} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}


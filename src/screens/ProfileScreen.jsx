import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSelector } from "react-redux";
import styles from "../../assets/styles/profile.styles";
import AdPlanModal from "../../components/AdPlanModal";
import AllAdsModal from "../../components/AllAdsModal";
import CreateAdModal from "../../components/CreateAdModal";
import EditAdModal from "../../components/EditAdModal";
import Loader from "../../components/Loader";
import ProfileHeader from "../../components/ProfileHeader";
import PurchaseHistoryModal from "../../components/PurchaseHistoryModal";
import COLORS from "../../constants/colors";
import { useDeleteReelMutation, useGetReelsByUserQuery } from "../../services/reelsApi";
import { useGetCurrentAdPlanQuery, useGetAdPlanHistoryQuery } from "../../services/adPlanApi";
import { selectUser } from "../../store/authSlice";

export default function ProfileScreen() {
  const [showAdPlanModal, setShowAdPlanModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteReelId, setDeleteReelId] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [showAutoPlayNotification, setShowAutoPlayNotification] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [showAllAdsModal, setShowAllAdsModal] = useState(false);
  const [showEditAdModal, setShowEditAdModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);

  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const user = useSelector(selectUser);
  const hasOpenedModalFromParam = useRef(false);

  // Navigate to AllReelsScreen if navigation param is present
  useEffect(() => {
    if (params?.openReels === "true" && !hasOpenedModalFromParam.current) {
      navigation.navigate('AllReels');
      hasOpenedModalFromParam.current = true;
    }
    // Reset when param changes to false/undefined
    if (params?.openReels !== "true") {
      hasOpenedModalFromParam.current = false;
    }
  }, [params?.openReels, navigation]);

  // Get user's reels using the specific user endpoint
  const {
    data: reelsData,
    isLoading,
    error,
    refetch
  } = useGetReelsByUserQuery(
    { userId: user?._id, page: 1, limit: 10 },
    { skip: !user?._id }
  );

  // Get current active ad plan
  const {
    data: currentPlanData,
    refetch: refetchCurrentPlan
  } = useGetCurrentAdPlanQuery(undefined, {
    skip: !user?._id,
    refetchOnMountOrArgChange: true
  });

  // Get ad plan history
  const {
    data: historyData
  } = useGetAdPlanHistoryQuery({ page: 1, limit: 100 }, {
    skip: !user?._id
  });

  // Delete reel mutation
  const [deleteReel, { isLoading: isDeleting }] = useDeleteReelMutation();

  // Debug logging

  const reels = reelsData?.data?.reels || [];
  const totalReels = reelsData?.data?.total || 0;
  const currentPlan = currentPlanData?.data;
  const planHistory = historyData?.data?.userAdPlans || [];

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <View style={styles.container}>
        <Loader />
      </View>
    );
  }


  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

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
      // The API will automatically refetch due to invalidated tags
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

  const renderPlanHistoryItem = ({ item }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'succeeded': return COLORS.success;
        case 'failed': return COLORS.error;
        case 'pending': return '#FFA500';
        case 'canceled': return COLORS.textSecondary;
        default: return COLORS.textSecondary;
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'succeeded': return 'checkmark-circle';
        case 'failed': return 'close-circle';
        case 'pending': return 'time-outline';
        case 'canceled': return 'close-outline';
        default: return 'help-circle-outline';
      }
    };

    const startDate = item?.planStartDate ? new Date(item.planStartDate).toLocaleDateString() : 'N/A';
    const endDate = item?.planEndDate ? new Date(item.planEndDate).toLocaleDateString() : 'N/A';
    const statusColor = getStatusColor(item?.paymentStatus);

    return (
      <View style={styles.planHistoryItem}>
        <View style={styles.planHistoryHeader}>
          <View style={styles.planHistoryTitle}>
            <Text style={styles.planHistoryName}>{item?.adPlan?.name || 'Plan'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Ionicons name={getStatusIcon(item?.paymentStatus)} size={14} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item?.paymentStatus?.toUpperCase() || 'UNKNOWN'}
              </Text>
            </View>
          </View>
          <Text style={styles.planHistoryAmount}>${item?.amount}</Text>
        </View>

        <View style={styles.planHistoryDetails}>
          <Text style={styles.planHistoryDetail}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
            {startDate} - {endDate}
          </Text>
          {item?.isActive && (
            <View style={styles.activeIndicator}>
              <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
        </View>
      </View>
    );
  };


  if (isLoading && !refreshing) return <Loader />;

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <ProfileHeader 
          onEditPress={handleEditProfile} 
          postsCount={totalReels}
        />

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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <ProfileHeader 
          onEditPress={handleEditProfile} 
          postsCount={totalReels}
        />

        {/* Ad Plan Buttons */}
        <View style={styles.adButtonsContainer}>
        <TouchableOpacity
          style={styles.adPlanButton}
          onPress={() => setShowAdPlanModal(true)}
        >
          <Ionicons name="card-outline" size={20} color={COLORS.white} />
          <Text style={styles.adPlanButtonText}>Ad Plans</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createAdButton}
          onPress={() => setShowAllAdsModal(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
          <Text style={styles.createAdButtonText}>My Ads</Text>
        </TouchableOpacity>
      </View>

      {/* Ad Plan Modal */}
      <AdPlanModal
        visible={showAdPlanModal}
        onClose={() => setShowAdPlanModal(false)}
      />

      {/* Create Ad Modal */}
      <CreateAdModal
        visible={showCreateAdModal}
        onClose={() => setShowCreateAdModal(false)}
        onSuccess={() => {
          setShowCreateAdModal(false);
          // Refetch current ad plan to update "Ads Used" count immediately
          refetchCurrentPlan();
          setShowAllAdsModal(true);
        }}
      />

      {/* Current Ad Plan Section */}
      {currentPlan && (
        <View style={styles.currentPlanContainer}>
          <View style={styles.currentPlanHeader}>
            <Ionicons name="trophy-outline" size={24} color={COLORS.primary} />
            <Text style={styles.currentPlanTitle}>Active Plan</Text>
            <TouchableOpacity onPress={() => setShowPlanDetails(!showPlanDetails)}>
              <Ionicons
                name={showPlanDetails ? "chevron-up" : "chevron-down"}
                size={20}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {showPlanDetails && (
            <View style={styles.planDetailsContent}>
              <View style={styles.planInfoRow}>
                <Text style={styles.planInfoLabel}>Plan Name:</Text>
                <Text style={styles.planInfoValue}>{currentPlan?.adPlan?.name}</Text>
              </View>
              <View style={styles.planInfoRow}>
                <Text style={styles.planInfoLabel}>Ads Used:</Text>
                <Text style={styles.planInfoValue}>
                  {currentPlan?.adsUsed || 0} / {currentPlan?.maxAds || 0}
                </Text>
              </View>
              <View style={styles.planInfoRow}>
                <Text style={styles.planInfoLabel}>Expires:</Text>
                <Text style={styles.planInfoValue}>
                  {currentPlan?.planEndDate ? new Date(currentPlan.planEndDate).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((currentPlan?.adsUsed || 0) / (currentPlan?.maxAds || 1)) * 100}%`
                    }
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Purchase History Section */}
      {planHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Purchase History</Text>
            <TouchableOpacity
              onPress={() => setShowHistoryModal(true)}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All ({planHistory.length})</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={planHistory.slice(0, 1)}
            renderItem={renderPlanHistoryItem}
            keyExtractor={(item) => item?._id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* YOUR REELS */}
      <View style={styles.reelsHeader}>
        <Text style={styles.reelsTitle}>Your Reels 🎬</Text>
        {totalReels > 1 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AllReels')}
            style={styles.viewAllReelsButton}
          >
            <Text style={styles.viewAllReelsText}>View All ({totalReels})</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {totalReels > 0 ? (
        <View style={styles.reelsPreviewContainer}>
          {reels.slice(0, 1).map((item) => (
            <View key={item?._id} style={styles.reelItem}>
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
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={50} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No reels yet</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Create')}>
            <Text style={styles.addButtonText}>Create Your First Reel</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>

      {/* Purchase History Modal */}
      <PurchaseHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />


      {/* All Ads Modal */}
      <AllAdsModal
        visible={showAllAdsModal}
        onClose={() => setShowAllAdsModal(false)}
        onCreateAdPress={() => {
          setShowAllAdsModal(false);
          setShowCreateAdModal(true);
        }}
        onEditPress={(advertisement) => {
          setSelectedAd(advertisement);
          setShowAllAdsModal(false);
          setShowEditAdModal(true);
        }}
      />

      {/* Edit Ad Modal */}
      <EditAdModal
        visible={showEditAdModal}
        onClose={() => {
          setShowEditAdModal(false);
          setSelectedAd(null);
        }}
        onSuccess={() => {
          setShowEditAdModal(false);
          setSelectedAd(null);
          // Refetch current ad plan to update "Ads Used" count immediately
          refetchCurrentPlan();
          // Small delay to ensure EditAdModal is fully closed before opening AllAdsModal
          setTimeout(() => {
            setShowAllAdsModal(true);
          }, 100);
        }}
        advertisement={selectedAd}
      />

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
 
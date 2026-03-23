import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import styles from "../assets/styles/allAds.styles";
import COLORS from "../constants/colors";
import { getImageUri } from "../utils/apiConfig";
import { 
  useGetUserAdvertisementsQuery,
  useDeleteAdvertisementMutation,
  useToggleAdvertisementStatusMutation
} from "../services/advertisementApi";
import EditAdModal from "./EditAdModal";

export default function AllAdsModal({ visible, onClose, onCreateAdPress, onEditPress }) {
  const user = useSelector((state) => state.auth.user);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAdvertisement, setSelectedAdvertisement] = useState(null);
  
  const { 
    data: advertisementsData,
    isLoading: isLoadingAds,
    refetch: refetchAds
  } = useGetUserAdvertisementsQuery(
    { userId: user?._id, params: { page: 1, limit: 100 } },
    { skip: !user?._id }
  );

  const [deleteAdvertisement, { isLoading: isDeleting }] = useDeleteAdvertisementMutation();
  const [toggleStatus, { isLoading: isToggling }] = useToggleAdvertisementStatusMutation();

  const advertisements = advertisementsData?.data?.advertisements || [];

  // Refetch ads when modal becomes visible and reset edit modal state
  useEffect(() => {
    if (visible && user?._id) {
      refetchAds();
      // Reset edit modal state when AllAdsModal opens
      setEditModalVisible(false);
      setSelectedAdvertisement(null);
    }
  }, [visible, user?._id]);

  const handleDelete = (adId) => {
    Alert.alert(
      "Delete Advertisement",
      "Are you sure you want to delete this advertisement?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteAdvertisement(adId).unwrap();
              // Refetch ads after successful deletion
              refetchAds();
              // Show success alert after a brief delay to avoid blocking UI
              setTimeout(() => {
                Alert.alert("Success", "Advertisement deleted successfully");
              }, 100);
            } catch (error) {
              Alert.alert("Error", error?.data?.message || "Failed to delete advertisement");
            }
          }
        },
      ]
    );
  };

  const handleToggleStatus = async (adId, currentStatus) => {
    try {
      await toggleStatus(adId).unwrap();
      // Refetch ads after successful status toggle
      refetchAds();
      // Show success alert after a brief delay to avoid blocking UI
      setTimeout(() => {
        Alert.alert("Success", `Advertisement ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      }, 100);
    } catch (error) {
      Alert.alert("Error", error?.data?.message || "Failed to update advertisement status");
    }
  };

  const handleEdit = (advertisement) => {
    setSelectedAdvertisement(advertisement);
    setEditModalVisible(true);
    if (onEditPress) {
      onEditPress(advertisement);
    }
  };

  const handleEditSuccess = () => {
    refetchAds();
    setEditModalVisible(false);
    setSelectedAdvertisement(null);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setSelectedAdvertisement(null);
  };

  const renderAdItem = ({ item }) => {
    const startDate = item?.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A';
    const endDate = item?.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A';
    const isActive = item?.isActive;
    const statusColor = isActive ? COLORS.success : COLORS.error;
    const statusText = isActive ? 'ACTIVE' : 'INACTIVE';
    const statusIcon = isActive ? 'checkmark-circle' : 'close-circle';

    return (
      <View style={styles.adItem}>
        <View style={styles.adHeader}>
          {/* Show Video or Banner Preview */}
          {(item?.adType === 'video' || item?.adType === 'both') && item?.videoUrl && (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: item?.videoUrl }} style={styles.previewImage} />
              <View style={styles.playOverlay}>
                <Ionicons name="play-circle" size={32} color={COLORS.white} />
              </View>
            </View>
          )}
          
          {(item?.adType === 'banner' || item?.adType === 'both') && item?.bannerUrl && item?.bannerUrl?.length > 0 && (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: item?.bannerUrl?.[0] }} style={styles.previewImage} />
            </View>
          )}
        </View>

        <View style={styles.adContent}>
          <View style={styles.adHeaderRow}>
            <Text style={styles.companyName} numberOfLines={1}>
              {item?.companyName || 'Advertisement'}
            </Text>
            <View style={[
              styles.statusBadge,
              isActive ? styles.statusBadgeActive : styles.statusBadgeInactive
            ]}>
              <Ionicons name={statusIcon} size={14} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>

          {/* Company Logo */}
          {item?.companyLogo && getImageUri(item.companyLogo) && (
            <View style={styles.logoContainer}>
              <Image source={{ uri: getImageUri(item.companyLogo) }} style={styles.logo} />
            </View>
          )}

          {/* Advertisement Description */}
          {item?.advertisementDescription && (
            <Text style={styles.description} numberOfLines={2}>
              {item?.advertisementDescription}
            </Text>
          )}

          {/* Ad Type Badge */}
          <View style={styles.badgesRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{item?.adType?.toUpperCase()}</Text>
            </View>
            <Text style={styles.likesText}>
              <Ionicons name="heart" size={14} color={COLORS.primary} />
              {item?.likes?.length || 0}
            </Text>
          </View>

          {/* Date Range */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.dateText}>
              {startDate} - {endDate}
            </Text>
          </View>

          {/* Link */}
          {item?.link && (
            <View style={styles.linkRow}>
              <Ionicons name="link-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.linkText} numberOfLines={1}>
                {item?.linkTitle || item?.link}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="pencil" size={16} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toggleButton, isActive ? styles.toggleButtonActive : styles.toggleButtonInactive]}
              onPress={() => handleToggleStatus(item?._id, isActive)}
              disabled={isToggling}
            >
              {isToggling ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons 
                    name={isActive ? "eye-off" : "eye"} 
                    size={16} 
                    color={COLORS.white} 
                  />
                  <Text style={styles.actionButtonText}>
                    {isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDelete(item?._id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="trash" size={16} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>My Advertisements</Text>
          <TouchableOpacity onPress={onCreateAdPress}>
            <Ionicons name="add-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {isLoadingAds ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading advertisements...</Text>
          </View>
        ) : advertisements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="megaphone-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No advertisements found</Text>
            <Text style={styles.emptySubText}>
              Create your first advertisement to get started
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={onCreateAdPress}>
              <Ionicons name="add-circle" size={20} color={COLORS.white} />
              <Text style={styles.createButtonText}>Create Advertisement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={advertisements}
            renderItem={renderAdItem}
            keyExtractor={(item) => item?._id}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
            refreshing={isLoadingAds}
            onRefresh={refetchAds}
          />
        )}
      </View>
      
      {/* Edit Ad Modal */}
      <EditAdModal
        visible={editModalVisible}
        onClose={handleCloseEditModal}
        advertisement={selectedAdvertisement}
        onSuccess={handleEditSuccess}
      />
    </Modal>
  );
}


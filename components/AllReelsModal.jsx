import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSelector } from "react-redux";
import styles from "../assets/styles/allReels.styles";
import COLORS from "../constants/colors";
import { useDeleteReelMutation, useGetReelsByUserQuery } from "../services/reelsApi";
import { selectUser } from "../store/authSlice";

export default function AllReelsModal({ visible, onClose }) {
  const router = useRouter();
  const user = useSelector(selectUser);
  const [deleteReelId, setDeleteReelId] = useState(null);

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
    // Close modal when video is pressed
    // The parent component can handle video playback separately
    onClose();
  };

  const handleDeleteReel = async (reelId) => {
    try {
      setDeleteReelId(reelId);
      await deleteReel(reelId).unwrap();
      Alert.alert("Success", "Reel deleted successfully");
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
          <Text style={styles.modalTitle}>Your Reels ({totalReels})</Text>
          <View style={{ width: 28 }} />
        </View>

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
                onClose();
                router.push("/create");
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
      </View>
    </Modal>
  );
}


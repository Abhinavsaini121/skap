import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSelector } from "react-redux";
import styles from "../assets/styles/purchaseHistory.styles";
import COLORS from "../constants/colors";
import { useGetAdPlanHistoryQuery } from "../services/adPlanApi";

export default function PurchaseHistoryModal({ visible, onClose }) {
  const user = useSelector((state) => state.auth.user);
  
  const { 
    data: historyData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory
  } = useGetAdPlanHistoryQuery({ page: 1, limit: 100 }, {
    skip: !user?._id
  });

  const planHistory = historyData?.data?.userAdPlans || [];

  const getStatusColor = (status) => {
    switch(status) {
      case 'succeeded': return COLORS.success;
      case 'failed': return COLORS.error;
      case 'pending': return '#FFA500';
      case 'canceled': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'succeeded': return 'checkmark-circle';
      case 'failed': return 'close-circle';
      case 'pending': return 'time-outline';
      case 'canceled': return 'close-outline';
      default: return 'help-circle-outline';
    }
  };

  const renderPlanHistoryItem = ({ item }) => {
    const startDate = item?.planStartDate ? new Date(item.planStartDate).toLocaleDateString() : 'N/A';
    const endDate = item?.planEndDate ? new Date(item.planEndDate).toLocaleDateString() : 'N/A';
    const statusColor = getStatusColor(item?.paymentStatus);
    const createdAt = item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';

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
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.planHistoryDetail}>
              {startDate} - {endDate}
            </Text>
          </View>
          {item?.isActive && (
            <View style={styles.activeIndicator}>
              <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
        </View>
        
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.purchaseDate}>Purchased: {createdAt}</Text>
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
          <Text style={styles.modalTitle}>Purchase History</Text>
          <View style={{ width: 28 }} />
        </View>

        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading purchase history...</Text>
          </View>
        ) : planHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No purchase history found</Text>
            <Text style={styles.emptySubText}>
              Your ad plan purchases will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={planHistory}
            renderItem={renderPlanHistoryItem}
            keyExtractor={(item) => item?._id}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
          />
        )}
      </View>
    </Modal>
  );
}


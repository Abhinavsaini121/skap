import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  AppState,
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { useSelector } from "react-redux";
import { selectUser } from "../store/authSlice";
import styles from "../assets/styles/adPlan.styles";
import COLORS from "../constants/colors";
import { useCreatePaymentIntentMutation, useGetActiveAdPlansQuery, useVerifyPaymentIntentMutation } from "../services/adPlanApi";
import { getStripePublishableKey } from "../utils/apiConfig";

export default function AdPlanModal({ visible, onClose }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();


  const user = useSelector(selectUser);

  const { data, isLoading, error } = useGetActiveAdPlansQuery();
  const [createPaymentIntent, { isLoading: isCreatingIntent }] = useCreatePaymentIntentMutation();
  const [verifyPaymentIntent] = useVerifyPaymentIntentMutation();

  const adPlans = data?.data || [];

  // When user returns from external browser, verify pending checkout (iOS: Guideline 3.1.1; same flow on Android)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState !== "active") return;
      const pendingSessionId = await AsyncStorage.getItem(PENDING_CHECKOUT_KEY);
      if (!pendingSessionId) return;
      try {
        const verificationResult = await verifyPaymentIntent(pendingSessionId).unwrap();
        await AsyncStorage.removeItem(PENDING_CHECKOUT_KEY);
        if (verificationResult?.success && verificationResult?.data) {
          const { paymentStatus, isActive } = verificationResult.data;
          if (paymentStatus === "succeeded" && isActive) {
            Alert.alert("Success! 🎉", "Payment successful! Your ad plan has been activated.");
          } else if (paymentStatus === "pending") {
            Alert.alert("Payment Processing", "Your payment is being processed. You will be notified once it's completed.");
          } else {
            Alert.alert("Payment Failed", "Your payment could not be processed. Please try again.");
          }
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        await AsyncStorage.removeItem(PENDING_CHECKOUT_KEY);
        Alert.alert("Verification Error", "Unable to verify payment status. Please check your purchase history.");
      }
    });
    return () => subscription.remove();
  }, [verifyPaymentIntent]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowDetails(true);
  };

  const handleBuy = async () => {
    if (!selectedPlan) return;

    const publishableKey = getStripePublishableKey();
    if (!publishableKey) {
      Alert.alert(
        "Configuration Error",
        "Stripe is not configured. Please add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment."
      );
      return;
    }

    try {
      const result = await createPaymentIntent(selectedPlan?._id).unwrap();

      if (!result?.success || !result?.data?.clientSecret) {
        Alert.alert("Error", result?.message || "No payment details received from server");
        return;
      }

      const { clientSecret, paymentIntentId } = result.data;

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Ad Plan",
      });

      if (initError) {
        console.error("Payment sheet init error:", initError);
        Alert.alert("Error", initError.message || "Failed to initialize payment");
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          return;
        }
        console.error("Payment sheet present error:", presentError);
        Alert.alert("Payment Failed", presentError.message || "Payment could not be completed");
        return;
      }

      try {
        const verificationResult = await verifyPaymentIntent(paymentIntentId).unwrap();
        const { paymentStatus, isActive } = verificationResult?.data || {};

        if (paymentStatus === "succeeded" && isActive) {
          onClose();
          setShowDetails(false);
          setSelectedPlan(null);
          Alert.alert("Success!", "Payment successful! Your ad plan has been activated.");
        } else if (paymentStatus === "pending") {
          onClose();
          setShowDetails(false);
          setSelectedPlan(null);
          Alert.alert(
            "Payment Processing",
            "Your payment is being processed. You will be notified once it's completed."
          );
        } else {
          Alert.alert("Payment Failed", "Your payment could not be processed. Please try again.");
        }
      } catch (verifyErr) {
        console.error("Error verifying payment:", verifyErr);
        onClose();
        setShowDetails(false);
        setSelectedPlan(null);
        Alert.alert(
          "Verification Error",
          "Payment may have succeeded. Please check your purchase history."
        );
      }
    } catch (err) {
      console.error("Error creating payment intent:", err);
      Alert.alert("Error", err?.data?.message || err?.message || "Failed to start payment");
    }
  };

  const renderPlanCard = ({ item }) => (
    <TouchableOpacity
      style={styles.planCard}
      onPress={() => handleSelectPlan(item)}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{item?.name}</Text>
        <View style={[
          styles.planTypeBadge,
          item?.userAdPlanType === 'premium' ? styles.premiumBadge : styles.basicBadge
        ]}>
          <Text style={styles.planTypeText}>{item?.userAdPlanType?.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.planPrice}>${item?.planAmount}</Text>

      <Text style={styles.planDuration}>{item?.planDuration} days</Text>

      <Text style={styles.planDescription} numberOfLines={2}>
        {item?.description || "No description"}
      </Text>

      <View style={styles.planFeatures}>
        <Text style={styles.featuresTitle}>Key Features:</Text>
        <Text style={styles.maxAds}>Max Ads: {item?.maxAds}</Text>
        {item?.features && item?.features?.length > 0 && (
          <Text style={styles.featuresList} numberOfLines={2}>
            {item?.features?.slice(0, 2).join(", ")}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => handleSelectPlan(item)}
      >
        <Text style={styles.selectButtonText}>View Details</Text>
        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderPlanDetails = () => (
    <View style={styles.detailsContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setShowDetails(false)}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <ScrollView style={styles.detailsContent}>
        <View style={styles.planHeader}>
          <Text style={styles.detailsTitle}>{selectedPlan?.name}</Text>
          <View style={[
            styles.planTypeBadge,
            selectedPlan?.userAdPlanType === 'premium' ? styles.premiumBadge : styles.basicBadge
          ]}>
            <Text style={styles.planTypeText}>
              {selectedPlan?.userAdPlanType?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsPriceSection}>
          <Text style={styles.detailsPrice}>${selectedPlan?.planAmount}</Text>
          <Text style={styles.detailsDuration}>{selectedPlan?.planDuration} days</Text>
        </View>

        {selectedPlan?.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{selectedPlan?.description}</Text>
          </View>
        )}

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What's Included</Text>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.featureText}>
              {selectedPlan?.maxAds} Ads Included
            </Text>
          </View>

          {selectedPlan?.features && selectedPlan?.features?.length > 0 ? (
            selectedPlan?.features?.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))
          ) : (
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.featureText}>Basic ad posting</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.buyButton, isCreatingIntent && styles.buyButtonDisabled]}
          onPress={handleBuy}
          disabled={isCreatingIntent}
        >
          {isCreatingIntent ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.buyButtonText}>Buy Now - ${selectedPlan?.planAmount}</Text>
              <Ionicons name="card" size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
          {showDetails && selectedPlan ? (
            <>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Plan Details</Text>
              <View style={{ width: 24 }} />
            </>
          ) : (
            <>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Ad Plans</Text>
              <View style={{ width: 24 }} />
            </>
          )}
        </View>

        {showDetails && selectedPlan ? (
          renderPlanDetails()
        ) : (
          <View style={styles.content}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading plans...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={50} color={COLORS.error} />
                <Text style={styles.errorTitle}>Failed to Load Plans</Text>
                <Text style={styles.errorMessage}>
                  {error?.data?.message || "Something went wrong"}
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => {}}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : adPlans.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cash-outline" size={50} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No plans available</Text>
              </View>
            ) : (
              <FlatList
                data={adPlans}
                renderItem={renderPlanCard}
                keyExtractor={(item) => item?._id}
                contentContainerStyle={styles.plansList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

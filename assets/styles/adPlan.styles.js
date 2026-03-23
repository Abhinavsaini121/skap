import { StyleSheet } from "react-native";
import COLORS from "../../constants/colors";

const styles = StyleSheet.create({
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Loading & Error states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  
  // Plan Card styles
  plansList: {
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
  },
  planTypeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  premiumBadge: {
    backgroundColor: "#FF6B6B",
  },
  basicBadge: {
    backgroundColor: COLORS.primary,
  },
  planTypeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  planDescription: {
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 16,
    lineHeight: 20,
  },
  planFeatures: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  maxAds: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  featuresList: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  selectButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  selectButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },
  
  // Details view styles
  detailsContainer: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: 16,
  },
  detailsContent: {
    flex: 1,
    padding: 20,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  detailsPriceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 24,
  },
  detailsPrice: {
    fontSize: 40,
    fontWeight: "700",
    color: COLORS.primary,
    marginRight: 12,
  },
  detailsDuration: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.textDark,
    lineHeight: 22,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 4,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.textDark,
    marginLeft: 12,
    flex: 1,
  },
  buyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 18,
  },
  
  // WebView styles for Stripe checkout
  webViewContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webViewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
  },
  webViewTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  webViewLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default styles;


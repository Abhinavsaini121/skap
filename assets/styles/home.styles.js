// styles/home.styles.js
import { Dimensions, StyleSheet } from "react-native";
import COLORS from "../../constants/colors";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  
  // Header Styles
  headerWrapper: {
    backgroundColor: COLORS.black,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50, // Increased top padding to account for translucent status bar
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  headerBackButton: {
    padding: 2,
    marginRight: 12,
  },
  headerBackButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  // Search Styles
  searchToggleButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexWrap: 'wrap',
    width: '100%',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flex: 1,
    minWidth: 140,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    paddingVertical: 0,
    minWidth: 100,
  },
  clearSearchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 4,
  },
  clearSearchButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  // Filter Tags Styles
  filterScrollView: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 20,
  },
  filterTag: {
    backgroundColor: "#3a3a3a", // Dark grey background
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  filterTagLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  filterTagText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.black,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: "center",
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.black,
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.error,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
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
    textAlign: "center",
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.black,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  createButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },

    // Advertisement Styles - Updated to match the provided image design
  adContainer: {
    height: screenHeight - 150, // Adjusted height to match reel container
    backgroundColor: '#1a1a2e', // Dark blue gradient background for advertisements
    position: 'relative',
  },
  adBanner: {
    flex: 1,
    width: "100%",
    backgroundColor: '#16213e', // Slightly lighter blue for the banner area
    position: 'relative',
    paddingTop: 50, // Account for status bar
    // Add gradient-like effect with border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 0,
  },
  
  // Brand Logo Container (Top Right)
  adLogoContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adLogo: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.white, // Red color like in image
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adBrandName: {
    fontSize: 18,
    fontWeight: "800",
    color:"white", // Red color like in image
    letterSpacing: 1,
  },
  
  // Main Content Area (Below Banner)
  adContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  
  // Text Content Below Banner
  adTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 80, // Account for social actions
  },
  adOfferText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.white, // White color
    marginBottom: 12,
    lineHeight: 50,
    flexWrap: 'wrap',
  },
  adDeliveryText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "500",
    marginTop: 8,
    opacity: 0.9,
  },
  
  // Half Screen Banner Images Slideshow
  adBannerContainer: {
    flex: 1,
    width: screenWidth,
    position: 'relative',
  },
  adBannerScrollView: {
    height: (screenHeight - 150) / 2, // Half screen height
    width: screenWidth,
  },
  adBannerImageContainer: {
    width: screenWidth,
    height: (screenHeight - 150) / 2, // Half screen height
    position: 'relative',
  },
  adBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  // Pagination Indicators
  adPaginationContainer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 30,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  adPaginationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  adPaginationDotActive: {
    backgroundColor: COLORS.white,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 8,
  },
  adContentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: screenWidth,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  // Bottom Section - CTA and Social
  adBottomSection: {
    position: 'absolute',
    bottom:80,
    left: 0,
    right:50,
    paddingHorizontal: 20,
    zIndex: 31,
  },
  adCTAButton: {
    backgroundColor: '#4A4A8A', // Dark blue button like in image
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  adCTAButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize:20,
  },
  adDescriptionText: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  adCTAArrow: {
    color: COLORS.white,
    fontSize: 16,
  },
  adSponsoredText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  
  // User Info for Advertisements
  adUserInfo: {
    position: 'absolute',
    bottom: 220,
    left: 20,
    right: 80,
    zIndex: 31,
  },
  adUserInfoTouchable: {
    flexDirection: "row",
    alignItems: "center",
  },
  adUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  adUsername: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
    marginRight: 12,
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Right Side Social Actions (matching reel layout)
  adRightActions: {
    position: "absolute",
    right: 16,
    bottom: 120,
    alignItems: "center",
    gap: 20,
    zIndex: 31,
  },
  adActionButton: {
    alignItems: "center",
    gap: 4,
  },
  adActionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "500",
  },
  
  // Ad Badge
  adBadge: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  adBadgeText: {
    color: '#333',
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Advertisement Countdown Styles
  adCountdownContainer: {
    position: "absolute",
    top: 20,
    left: "50%",
    transform: [{ translateX: -30 }], // Center the container
    alignItems: "center",
    zIndex: 5,
  },
  adCountdownCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderWidth: 3,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  adCountdownText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  adCountdownLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  adSkipButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  adSkipButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  // Reel Styles
  reelContainer: {
    height: screenHeight - 150, // Adjusted height to work with translucent status bar and header
    backgroundColor: COLORS.black,
  },
  videoContainer: {
    flex: 1,
    position: "relative",
  },
  videoTouchable: {
    flex: 1,
    position: "relative",
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  videoControlsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  adPauseIndicator: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  adPauseText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  audioButton: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    pointerEvents: "box-none", // Allow touches to pass through to video
  },

  // Right Side Actions
  rightActions: {
    position: "absolute",
    right: 16,
    bottom: 120,
    alignItems: "center",
    gap: 20,
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "500",
  },

  // Bottom Info
  bottomInfo: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 80,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  userInfoTouchable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
    flex: 1,
  },
  followButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    minWidth: 80,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  followButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  followingButtonText: {
    color: COLORS.white,
  },
  caption: {
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 8,
    lineHeight: 18,
  },
  musicInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  musicText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
  },

  // Loading Footer Styles
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.black,
  },
  loadingFooterText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },




});

export default styles;

import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as Haptics from 'expo-haptics';
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";

/**
 * Home Component with Instagram-like Reel Experience
 * 
 * Features:
 * - Vertical scrolling reels with pagination
 * - Instagram-like video behavior: auto-play on scroll, auto-pause when not visible
 * - Instagram-like audio behavior: turning off audio for one video mutes all videos
 * - Video play/pause controls
 * - Like, comment, and share functionality
 * - Advertisement banners every 3 reels with cycling pattern
 * - Error handling and fallback for failed videos
 * - Progress indicator showing current video position
 * - Auto-scroll to next video when current video finishes (if user hasn't manually scrolled)
 * - Optimized performance to prevent crashes after 9th reel
 */
 

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  StatusBar,
  AppState,
  Share,
  ScrollView,
  InteractionManager,
  Platform,
} from "react-native";
import { useFocusEffect, useNavigationState, useNavigation, useRoute } from '@react-navigation/native';
import { homeRefreshRef } from '../navigation/homeRefreshRef';
import { useSelector } from "react-redux";
import * as ExpoLinking from 'expo-linking';
import styles from "../../assets/styles/home.styles";
import COLORS from "../../constants/colors";
import { useGetReelsQuery, useToggleLikeMutation, useTrackShareMutation, useTrackViewMutation } from "../../services/reelsApi";
import { useGetActiveAdvertisementsQuery, useToggleAdvertisementLikeMutation, useGetAdvertisementLikeCountQuery, useGetActiveAdShowOrderNosQuery } from "../../services/advertisementApi";
import { useGetActiveWebLinksQuery } from "../../services/webLinksApi";
import { useFollowUserMutation, useUnfollowUserMutation, useGetFollowStatusQuery } from "../../services/userApi";
import { tokenStorage } from "../../utils/tokenStorage";
import { BASE_URL } from "../../utils/apiConfig";
import { selectUser } from "../../store/authSlice";
import ReelItem from "../components/ReelItem";
import AdvertisementItem from "../components/AdvertisementItem";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const APP_SCHEME = 'reelapp';


export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [likedReels, setLikedReels] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [likedAdvertisements, setLikedAdvertisements] = useState(new Set());
  const [videoStates, setVideoStates] = useState({});
  const [audioStates, setAudioStates] = useState({});
  const [globalAudioOn, setGlobalAudioOn] = useState(true);
  const [videoErrors, setVideoErrors] = useState({});
  const [trackedViews, setTrackedViews] = useState(new Set()); // Track which reels have had views tracked
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [lastManualScroll, setLastManualScroll] = useState(0);
  const [adBannerScrollIndex, setAdBannerScrollIndex] = useState({});
  const [pendingDeepLinkReelId, setPendingDeepLinkReelId] = useState(null);
  const [isAppInForeground, setIsAppInForeground] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchCaption, setSearchCaption] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [followingUsers, setFollowingUsers] = useState(new Set()); // Track which users are being followed
  const [followStatusLoading, setFollowStatusLoading] = useState({}); // Track loading states per user
  const [manuallyPausedReelId, setManuallyPausedReelId] = useState(null); // Track which reel was manually paused by user
  const isFocusedRef = useRef(false);

  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const timeoutRefs = useRef({});
  const intervalRefs = useRef({});
  const adBannerScrollRefs = useRef({});
  const adLikeCountPollInterval = useRef(null);
  const adLikeCountsRef = useRef({});
  const deepLinkRetryTimeoutRef = useRef(null);
  const handledRouteReelIdRef = useRef(null);
  const webLinksScrollRef = useRef(null);
  const webLinksAutoScrollInterval = useRef(null);
  const webLinksScrollPosition = useRef(0);
  
  const user = useSelector(selectUser);
  const navigationState = useNavigationState(state => state);
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params || {};
  const routeReelIdParam = routeParams.reelId;
  const routeUserIdParam = routeParams.userId;
  const directRouteReelId = useMemo(() => {
    if (Array.isArray(routeReelIdParam)) {
      const [first] = routeReelIdParam;
      return typeof first === 'string' && first.trim().length > 0 ? first.trim() : undefined;
    }

    if (typeof routeReelIdParam === 'string') {
      const trimmed = routeReelIdParam.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    return undefined;
  }, [routeReelIdParam]);
  const directRouteUserId = useMemo(() => {
    if (Array.isArray(routeUserIdParam)) {
      const [first] = routeUserIdParam;
      return typeof first === 'string' && first.trim().length > 0 ? first.trim() : undefined;
    }

    if (typeof routeUserIdParam === 'string') {
      const trimmed = routeUserIdParam.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    return undefined;
  }, [routeUserIdParam]);
  const reelsQueryArgs = useMemo(() => {
    const args = {
      page: 1,
      limit: 10,
    };
    
    if (directRouteUserId) {
      args.userId = directRouteUserId;
    }
    
    // Add country from logged-in user
    // if (user?.country) {
    //   args.country = user.country;
    // }
    
    // Add search parameters
    if (searchName && searchName.trim()) {
      args.name = searchName.trim();
    }
    if (searchCaption && searchCaption.trim()) {
      args.caption = searchCaption.trim();
    }
    
    return args;
  }, [directRouteUserId, searchName, searchCaption]);
  
  // Get all reels with pagination (country filter commented out - showing reels from everywhere)
  const { data: reelsData, isLoading, error, refetch } = useGetReelsQuery(
    reelsQueryArgs,
    { refetchOnMountOrArgChange: true }
  );
  
  

  
  // Like/Unlike reel mutation
  const [toggleLike, { isLoading: isLikeLoading }] = useToggleLikeMutation();
  
  // Like/Unlike advertisement mutation
  const [toggleAdvertisementLike, { isLoading: isAdvertisementLikeLoading }] = useToggleAdvertisementLikeMutation();
  
  // Track share mutation
  const [trackShare, { isLoading: isShareTrackingLoading }] = useTrackShareMutation();
  
  // Track view mutation
  const [trackView] = useTrackViewMutation();
  
  // Follow/Unfollow mutations
  const [followUser, { isLoading: isFollowLoading }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowLoading }] = useUnfollowUserMutation();
  
  // Get active advertisements
  const { data: advertisementsData, isLoading: isAdvertisementsLoading, error: advertisementsError, refetch: refetchAdvertisements } = useGetActiveAdvertisementsQuery(
    { adType: 'banner' }, // Only fetch banner advertisements for now
    { refetchOnMountOrArgChange: true }
  );

  // Get active ad show order numbers
  const { data: adShowOrderNosData, isLoading: isAdShowOrderNosLoading, refetch: refetchAdShowOrderNos } = useGetActiveAdShowOrderNosQuery(
    undefined,
    { refetchOnMountOrArgChange: true }
  );

  // Get active web links
  const { data: webLinksData, isLoading: isWebLinksLoading, refetch: refetchWebLinks } = useGetActiveWebLinksQuery(
    undefined,
    { refetchOnMountOrArgChange: true }
  );

  // Extract web links from API response
  const webLinks = useMemo(() => {
    if (webLinksData && webLinksData.success && Array.isArray(webLinksData.data)) {
      return webLinksData.data.filter(link => link && link.isActive === true);
    }
    return [];
  }, [webLinksData]);

  // Auto-scroll functionality for web links
  useEffect(() => {
    // Reset scroll position when web links change
    webLinksScrollPosition.current = 0;
    if (webLinksScrollRef.current) {
      webLinksScrollRef.current.scrollTo({
        x: 0,
        animated: false,
      });
    }

    if (webLinks.length <= 1) {
      // Clear interval if there's only one or no links
      if (webLinksAutoScrollInterval.current) {
        clearInterval(webLinksAutoScrollInterval.current);
        webLinksAutoScrollInterval.current = null;
      }
      return;
    }

    // Wait for ScrollView to be ready
    const startAutoScroll = () => {
      if (!webLinksScrollRef.current) {
        setTimeout(startAutoScroll, 100);
        return;
      }

      const scrollStep = 1; // Pixels to scroll per interval
      const scrollInterval = 50; // Milliseconds between scroll steps (smooth scrolling)
      
      // Start continuous auto-scroll
      webLinksAutoScrollInterval.current = setInterval(() => {
        if (webLinksScrollRef.current) {
          webLinksScrollPosition.current += scrollStep;
          
          // Get approximate content width (each tag is ~150px + 12px gap)
          const estimatedContentWidth = webLinks.length * 162;
          const maxScroll = Math.max(0, estimatedContentWidth - screenWidth);
          
          // Reset to start if we've scrolled past the end
          if (webLinksScrollPosition.current > maxScroll) {
            webLinksScrollPosition.current = 0;
            webLinksScrollRef.current.scrollTo({
              x: 0,
              animated: false,
            });
          } else {
            webLinksScrollRef.current.scrollTo({
              x: webLinksScrollPosition.current,
              animated: false, // Use false for smooth continuous scrolling
            });
          }
        }
      }, scrollInterval);
    };

    // Start after a short delay to ensure ScrollView is ready
    const timeoutId = setTimeout(startAutoScroll, 500);

    return () => {
      clearTimeout(timeoutId);
      if (webLinksAutoScrollInterval.current) {
        clearInterval(webLinksAutoScrollInterval.current);
        webLinksAutoScrollInterval.current = null;
      }
    };
  }, [webLinks.length]);
  
  // Extract reels from the transformed response - memoized to prevent infinite re-renders
  const reels = useMemo(() => {
    return reelsData?.data?.reels || [];
  }, [reelsData?.data?.reels]);
  
  const totalReels = useMemo(() => {
    return reelsData?.data?.total || reels.length;
  }, [reelsData?.data?.total, reels.length]);

  useEffect(() => {
    setCurrentVideoIndex(0);
    setVideoStates({});
    setAudioStates({});
    setVideoErrors({});
    setLikeCounts({});
    setLikedReels(new Set());
    setTrackedViews(new Set()); // Reset tracked views when user changes
    setManuallyPausedReelId(null); // Clear manual pause state
    setAutoScrollEnabled(true); // Re-enable auto-scroll
  }, [directRouteUserId]);
  
  // Calculate total items including advertisements - memoized (uses dynamic adShowOrderNo)
  const totalItems = useMemo(() => {
    const adsPerCycle = adShowOrderNo - 1; // Number of reels between ads
    return reels.length + Math.floor(reels.length / adsPerCycle);
  }, [reels.length, adShowOrderNo]);

  // Extract and process advertisements for cycling - memoized
  const advertisements = useMemo(() => {
    if (advertisementsError || isAdvertisementsLoading) {
      return [];
    }
    
    if (advertisementsData && advertisementsData.status === 1 && Array.isArray(advertisementsData.data)) {
      return advertisementsData.data.filter(ad => {
        // Basic validation: ad must exist and have a company name
        if (!ad || typeof ad !== 'object' || !ad.companyName || ad.companyName.trim() === '') {
          return false;
        }
        
        // Get user's country
        const userCountry = user?.country;
        
        // Get ad's allowed countries
        const allowedCountries = ad.allowedCountry || [];
        
        // Show ad if:
        // 1. allowedCountry array is empty (available to all countries), OR
        // 2. user's country matches one of the allowed countries
        if (allowedCountries.length === 0) {
          return true; // Available to all countries
        }
        
        // Check if user's country is in the allowed countries list
        if (userCountry && allowedCountries.includes(userCountry)) {
          return true;
        }
        
        // If user has no country set, don't show country-restricted ads
        return false;
      });
    }
    
    return [];
  }, [advertisementsError, isAdvertisementsLoading, advertisementsData, user?.country]);
     
  // Use advertisements from API only, no fallback data
  const finalAdvertisements = advertisements;

  // Extract ad show order number from API response - memoized
  const adShowOrderNo = useMemo(() => {
    if (adShowOrderNosData && adShowOrderNosData.success && Array.isArray(adShowOrderNosData.data) && adShowOrderNosData.data.length > 0) {
      const activeOrder = adShowOrderNosData.data.find(order => order.isActive === true);
      if (activeOrder && activeOrder.adShowOrderNo) {
        const orderNo = parseInt(activeOrder.adShowOrderNo, 10);
        return isNaN(orderNo) ? 4 : orderNo; // Default to 4 if invalid
      }
    }
    return 4; // Default to 4 if no data available
  }, [adShowOrderNosData]);

  // Function to get advertisement for specific index with cycling
  const getAdvertisementForIndex = (reelIndex) => {
    if (!finalAdvertisements || finalAdvertisements.length === 0) return null;
    
    // Calculate which ad cycle we're in (every adShowOrderNo items: (adShowOrderNo-1) reels + 1 ad)
    const adCycleIndex = Math.floor(reelIndex / adShowOrderNo);
    
    // Get the advertisement index within the available ads (cycles through all ads)
    const adIndex = adCycleIndex % finalAdvertisements.length;
    
    return finalAdvertisements[adIndex];
  };

  // Function to check if current index should show an advertisement - memoized
  const shouldShowAdvertisement = useCallback((index) => {
    // Only show ads if we have advertisements from API
    if (!finalAdvertisements || finalAdvertisements.length === 0) return false;
    
    // Show ad every adShowOrderNo-th item (after every (adShowOrderNo-1) reels)
    return index > 0 && (index + 1) % adShowOrderNo === 0;
  }, [finalAdvertisements, adShowOrderNo]);

  // Comment counts are now retrieved directly from API responses (reel.commentsCount, advertisement.commentsCount)
  // No separate API calls needed

  // Removed manual fetch function - now using only RTK Query hooks

  // State for advertisement like counts
  const [advertisementLikeCounts, setAdvertisementLikeCounts] = useState({});

  // Function to fetch like counts for all advertisements with caching - memoized
  const fetchAdvertisementLikeCounts = useCallback(async (forceRefresh = false) => {
    if (advertisements.length === 0) return;
    
    // Check if we already have counts for all advertisements and don't need to refresh
    if (!forceRefresh) {
      const hasAllCounts = advertisements.every(ad => 
        ad._id && adLikeCountsRef.current[ad._id] !== undefined
      );
      if (hasAllCounts) {
        return;
      }
    }
    
    
    try {
      const counts = { ...adLikeCountsRef.current }; // Start with existing counts
      const promises = [];
      
      for (const ad of advertisements) {
        if (ad._id) {
          // Only fetch if we don't have the count or if force refresh
          if (forceRefresh || counts[ad._id] === undefined) {
            const promise = fetch(`${BASE_URL}/advertisements/${ad._id}/likes/count`, {
              headers: {
                'Authorization': `Bearer ${await tokenStorage.getAccessToken()}`,
                'Content-Type': 'application/json'
              }
            })
            .then(async (response) => {
              if (response.ok) {
                const data = await response.json();
                const count = data.data?.likesCount || 0;
                return { adId: ad._id, count };
              } else {
                return { adId: ad._id, count: 0 };
              }
            })
            .catch((error) => {
              return { adId: ad._id, count: 0 };
            });
            
            promises.push(promise);
          }
        }
      }
      
      // Wait for all API calls to complete
      if (promises.length > 0) {
        const results = await Promise.all(promises);
        results.forEach(({ adId, count }) => {
          counts[adId] = count;
        });
      }
      
      adLikeCountsRef.current = counts;
      setAdvertisementLikeCounts(counts);
    } catch (error) {
    }
  }, [advertisements]);

  const activateReelAtIndex = useCallback((index) => {
    setCurrentVideoIndex(prev => (prev === index ? prev : index));

    const targetReelId = reels[index]?._id;
    if (!targetReelId) {
      return;
    }

    setVideoStates(prev => {
      const desiredStates = reels.reduce((acc, reel) => {
        acc[reel._id] = reel._id === targetReelId;
        return acc;
      }, {});

      const keys = Object.keys(desiredStates);
      const needsUpdate = keys.some(key => prev[key] !== desiredStates[key]) ||
        Object.keys(prev).some(key => !desiredStates.hasOwnProperty(key));

      if (!needsUpdate) {
        return prev;
      }

      return { ...desiredStates };
    });

    setAudioStates(prev => {
      const desiredStates = reels.reduce((acc, reel) => {
        acc[reel._id] = globalAudioOn;
        return acc;
      }, {});

      const keys = Object.keys(desiredStates);
      const needsUpdate = keys.some(key => prev[key] !== desiredStates[key]) ||
        Object.keys(prev).some(key => !desiredStates.hasOwnProperty(key));

      if (!needsUpdate) {
        return prev;
      }

      return { ...desiredStates };
    });

    setIsVideoPlaying(true);
  }, [reels, globalAudioOn]);

  const scrollToReelById = useCallback((reelId) => {
    if (!reelId || !Array.isArray(reels) || reels.length === 0) {
      return false;
    }

    const reelIndex = reels.findIndex(reel => reel._id === reelId);

    if (reelIndex === -1) {
      return false;
    }

    const candidateIndexes = new Set();
    candidateIndexes.add(reelIndex);

    if (adShowOrderNo > 1) {
      const adsPerCycle = adShowOrderNo - 1;
      const withAdsOffset = reelIndex + Math.floor(reelIndex / adsPerCycle);
      candidateIndexes.add(withAdsOffset);
    }

    if (!flatListRef.current) {
      return false;
    }

    for (const index of candidateIndexes) {
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
        });
        activateReelAtIndex(index);
        return true;
      } catch (scrollError) {
        try {
          flatListRef.current.scrollToOffset({
            offset: Math.max(screenHeight - 150, 0) * Math.max(index, 0),
            animated: true,
          });
          activateReelAtIndex(index);
          return true;
        } catch (offsetError) {
          continue;
        }
      }
    }

    return false;
  }, [adShowOrderNo, reels, activateReelAtIndex]);

  useEffect(() => {
    if (!directRouteReelId) {
      handledRouteReelIdRef.current = null;
      return;
    }

    if (handledRouteReelIdRef.current === directRouteReelId) {
      return;
    }

    handledRouteReelIdRef.current = directRouteReelId;

    const handled = scrollToReelById(directRouteReelId);

    if (handled) {
      setPendingDeepLinkReelId(null);
    } else {
      setPendingDeepLinkReelId(prev => (prev === directRouteReelId ? prev : directRouteReelId));
    }

    // Note: In React Navigation, we don't need to clear params like this
    // The params will be cleared when navigating away
  }, [directRouteReelId, scrollToReelById]);

  // Function to handle deep link navigation
  const handleDeepLink = useCallback((url) => {
    try {
      const parsedUrl = ExpoLinking.parse(url);
      const pathSegments = parsedUrl.path
        ? parsedUrl.path.split('/').filter(Boolean)
        : [];

      let reelId = parsedUrl.queryParams?.reelId;

      if (!reelId) {
        const reelSegmentIndex = pathSegments.findIndex(segment => segment.toLowerCase() === 'reel');
        if (reelSegmentIndex !== -1 && pathSegments[reelSegmentIndex + 1]) {
          reelId = pathSegments[reelSegmentIndex + 1];
        }
      }

      if (reelId) {
        setPendingDeepLinkReelId(prev => (prev === reelId ? prev : reelId));

        const handled = scrollToReelById(reelId);

        if (handled) {
          setPendingDeepLinkReelId(null);
        }
      }
    } catch (error) {
      // Silently handle deep link errors
    }
  }, [scrollToReelById]);

  // Handle deep links to navigate to specific reels
  useEffect(() => {
    // Handle initial deep link when app opens
    const handleInitialURL = async () => {
      const initialUrl = await ExpoLinking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    // Handle deep links when app is already open
    const subscription = ExpoLinking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Process initial URL
    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  useEffect(() => {
    if (!pendingDeepLinkReelId) {
      return;
    }

    let attemptCount = 0;
    const maxAttempts = 15;
    let isActive = true;

    if (deepLinkRetryTimeoutRef.current) {
      clearTimeout(deepLinkRetryTimeoutRef.current);
      deepLinkRetryTimeoutRef.current = null;
    }

    const attemptScroll = () => {
      if (!isActive) {
        return;
      }

      const handled = scrollToReelById(pendingDeepLinkReelId);

      if (handled) {
        setPendingDeepLinkReelId(null);
        return;
      }

      if (attemptCount < maxAttempts) {
        attemptCount += 1;
        deepLinkRetryTimeoutRef.current = setTimeout(attemptScroll, 400);
      }
    };

    attemptScroll();

    return () => {
      isActive = false;
      if (deepLinkRetryTimeoutRef.current) {
        clearTimeout(deepLinkRetryTimeoutRef.current);
        deepLinkRetryTimeoutRef.current = null;
      }
    };
  }, [pendingDeepLinkReelId, scrollToReelById]);

  // Fetch advertisement like counts when advertisements change
  React.useEffect(() => {
    fetchAdvertisementLikeCounts();
  }, [fetchAdvertisementLikeCounts]);

  // Polling mechanism for advertisement like counts
  React.useEffect(() => {
    if (advertisements.length === 0) return;

    // Initial fetch
    fetchAdvertisementLikeCounts();

    // Set up polling interval (every 30 seconds) only if app is in foreground
    if (isAppInForeground && !adLikeCountPollInterval.current) {
      adLikeCountPollInterval.current = setInterval(() => {
        fetchAdvertisementLikeCounts(true); // Force refresh
      }, 30000); // 30 seconds
    }

    // Cleanup interval on unmount or when advertisements change
    return () => {
      if (adLikeCountPollInterval.current) {
        clearInterval(adLikeCountPollInterval.current);
        adLikeCountPollInterval.current = null;
      }
    };
  }, [fetchAdvertisementLikeCounts, advertisements.length, isAppInForeground]);

  // Optimized auto-scroll function to prevent crashes
  const autoScrollToNext = useCallback(() => {
    try {
      if (!autoScrollEnabled || !reels.length) return;
      
      // Check if current video was manually paused by user
      const currentReelId = reels[currentVideoIndex]?._id;
      if (currentReelId && manuallyPausedReelId === currentReelId) {
        // Don't auto-scroll if user manually paused this video
        return;
      }
      
      // Check if user has manually scrolled recently (within last 2 seconds)
      const timeSinceLastScroll = Date.now() - lastManualScroll;
      if (timeSinceLastScroll < 2000) {
        return;
      }
      
      const adsPerCycle = adShowOrderNo - 1; // Number of reels between ads
      const totalItems = reels.length + Math.floor(reels.length / adsPerCycle);
      
      if (currentVideoIndex < totalItems - 1) {
        const nextIndex = currentVideoIndex + 1;
        
        // Clear any existing timeout for this operation
        if (timeoutRefs.current.autoScroll) {
          clearTimeout(timeoutRefs.current.autoScroll);
        }
        
        // Update current video index
        setCurrentVideoIndex(nextIndex);
        
        // Scroll to the next item with error handling
        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          } catch (scrollError) {
            // Fallback to scrollToOffset if scrollToIndex fails
            flatListRef.current.scrollToOffset({
              offset: (screenHeight - 150) * nextIndex,
              animated: true,
            });
          }
        }
        
        // Update video states efficiently
        if (!shouldShowAdvertisement(nextIndex)) {
          const nextReelId = reels[nextIndex]?._id;
          if (nextReelId) {
            setVideoStates(prev => {
              const newStates = { ...prev };
              // Only update the necessary states instead of recreating all
              Object.keys(newStates).forEach(reelId => {
                newStates[reelId] = reelId === nextReelId;
              });
              return newStates;
            });
          }
        } else {
          // Pause all videos for advertisement
          setVideoStates(prev => {
            const pausedStates = { ...prev };
            Object.keys(pausedStates).forEach(reelId => {
              pausedStates[reelId] = false;
            });
            return pausedStates;
          });
          
          // Auto-scroll after advertisement with timeout management
          timeoutRefs.current.autoScroll = setTimeout(() => {
            try {
              let nextVideoIndex = nextIndex + 1;
              while (nextVideoIndex < totalItems && shouldShowAdvertisement(nextVideoIndex)) {
                nextVideoIndex++;
              }
              
              if (nextVideoIndex < totalItems) {
                setCurrentVideoIndex(nextVideoIndex);
                
                if (flatListRef.current) {
                  try {
                    flatListRef.current.scrollToIndex({
                      index: nextVideoIndex,
                      animated: true,
                    });
                  } catch (scrollError) {
                    flatListRef.current.scrollToOffset({
                      offset: (screenHeight - 150) * nextVideoIndex,
                      animated: true,
                    });
                  }
                }
                
                const nextReelId = reels[nextVideoIndex]?._id;
                if (nextReelId) {
                  setVideoStates(prev => {
                    const newStates = { ...prev };
                    Object.keys(newStates).forEach(reelId => {
                      newStates[reelId] = reelId === nextReelId;
                    });
                    return newStates;
                  });
                }
              }
            } catch (error) {
            }
          }, 3000);
        }
      }
    } catch (error) {
    }
  }, [autoScrollEnabled, reels, currentVideoIndex, lastManualScroll, adShowOrderNo, shouldShowAdvertisement, manuallyPausedReelId]);

  // Optimized video and audio state initialization
  const initializeVideoStates = useCallback(() => {
    if (reels.length === 0) return;
    
    setVideoStates(prev => {
      const newVideoStates = {};
      reels.forEach((reel, index) => {
        if (!(reel._id in prev)) {
          newVideoStates[reel._id] = index === 0;
        }
      });
      
      if (Object.keys(newVideoStates).length > 0) {
        return { ...prev, ...newVideoStates };
      }
      return prev;
    });
    
    setAudioStates(prev => {
      const newAudioStates = {};
      reels.forEach((reel) => {
        if (!(reel._id in prev)) {
          newAudioStates[reel._id] = globalAudioOn;
        }
      });
      
      if (Object.keys(newAudioStates).length > 0) {
        return { ...prev, ...newAudioStates };
      }
      return prev;
    });
  }, [reels, globalAudioOn]);

  // Initialize states when reels change
  useEffect(() => {
    initializeVideoStates();
  }, [initializeVideoStates]);

  // Optimized cleanup function
  const cleanupAllResources = useCallback(() => {
    try {
      // Clear all timeouts
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      timeoutRefs.current = {};
      
      // Clear all intervals
      Object.values(intervalRefs.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
      intervalRefs.current = {};
      
      // Clear like count polling interval
      if (adLikeCountPollInterval.current) {
        clearInterval(adLikeCountPollInterval.current);
        adLikeCountPollInterval.current = null;
      }
      
      // Pause all videos
      setVideoStates(prev => {
        const pausedStates = {};
        Object.keys(prev).forEach(reelId => {
          pausedStates[reelId] = false;
        });
        return pausedStates;
      });
      
      // Cleanup video refs
      cleanupVideoRefs();
    } catch (error) {
    }
  }, []);

  // Cleanup on unmount and when reels change
  useEffect(() => {
    return () => {
      cleanupAllResources();
    };
  }, [cleanupAllResources]);

  // Additional cleanup when reels change to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear all timeouts and intervals when reels change
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      Object.values(intervalRefs.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
      // Clear like count polling interval
      if (adLikeCountPollInterval.current) {
        clearInterval(adLikeCountPollInterval.current);
        adLikeCountPollInterval.current = null;
      }
    };
  }, [reels]);

  // Initialize liked reels state and like counts based on API data
  React.useEffect(() => {
    if (reels.length > 0) {
      const userLikedReels = new Set();
      const newLikeCounts = {};
      
      reels.forEach(reel => {
        // Initialize like count
        newLikeCounts[reel._id] = reel.likes?.length || 0;
        
        // Check if the current user has liked this reel
        if (user && reel.likes && Array.isArray(reel.likes)) {
          const hasLiked = reel.likes.some(like => 
            typeof like === 'string' ? like === user.id : like._id === user.id
          );
          if (hasLiked) {
            userLikedReels.add(reel._id);
          }
        }
      });
      
      setLikedReels(userLikedReels);
      setLikeCounts(newLikeCounts);
    }
  }, [reels, user]);

  // Initialize liked advertisements state based on API data
  React.useEffect(() => {
    if (advertisements.length > 0) {
      const userLikedAdvertisements = new Set();
      
      advertisements.forEach(ad => {
        // Check if the current user has liked this advertisement
        if (user && ad.likes && Array.isArray(ad.likes)) {
          const hasLiked = ad.likes.some(like => 
            typeof like === 'string' ? like === user.id : like._id === user.id
          );
          if (hasLiked) {
            userLikedAdvertisements.add(ad._id);
          }
        }
      });
      
      setLikedAdvertisements(userLikedAdvertisements);
    }
  }, [advertisements, user]);

  // Optimized video state synchronization
  const syncVideoStates = useCallback(() => {
    if (reels.length === 0 || currentVideoIndex < 0) return;
    
    const currentReelId = reels[currentVideoIndex]?._id;
    if (!currentReelId) return;
    
    setVideoStates(prev => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach(reelId => {
        newStates[reelId] = reelId === currentReelId;
      });
      return newStates;
    });
    
    setAudioStates(prev => {
      const newAudioStates = { ...prev };
      Object.keys(newAudioStates).forEach(reelId => {
        newAudioStates[reelId] = globalAudioOn;
      });
      return newAudioStates;
    });
  }, [currentVideoIndex, reels, globalAudioOn]);

  // Sync video states when current video index changes
  useEffect(() => {
    syncVideoStates();
  }, [syncVideoStates]);

  // Register refresh callback with the layout
  useEffect(() => {
    homeRefreshRef.current = handleRefresh;

    return () => {
      homeRefreshRef.current = null;
    };
  }, [handleRefresh]);

  // Optimized focus effect
  useFocusEffect(
    useCallback(() => {
      // Mark that we're now focused
      isFocusedRef.current = true;

      // Refetch reels and advertisements when returning to screen to update comment counts
      // This ensures comment counts are updated after adding comments
      refetch();
      refetchAdvertisements();

      if (reels.length === 0 || currentVideoIndex < 0) {
        return () => {
          isFocusedRef.current = false;
        };
      }
      
      const currentReelId = reels[currentVideoIndex]?._id;
      if (!currentReelId) {
        return () => {
          isFocusedRef.current = false;
        };
      }
      
      // Clear any existing timeout
      if (timeoutRefs.current.focus) {
        clearTimeout(timeoutRefs.current.focus);
      }
      
      // Restore video playback with delay
      timeoutRefs.current.focus = setTimeout(() => {
        setVideoStates(prev => {
          const newStates = { ...prev };
          Object.keys(newStates).forEach(reelId => {
            newStates[reelId] = reelId === currentReelId;
          });
          return newStates;
        });
        
        setAudioStates(prev => {
          const newAudioStates = { ...prev };
          Object.keys(newAudioStates).forEach(reelId => {
            newAudioStates[reelId] = globalAudioOn;
          });
          return newAudioStates;
        });
        
        setIsVideoPlaying(true);
      }, 300);
      
      return () => {
        isFocusedRef.current = false;

        if (timeoutRefs.current.focus) {
          clearTimeout(timeoutRefs.current.focus);
        }
        
        // Pause all videos immediately
        setVideoStates(prev => {
          const pausedStates = { ...prev };
          Object.keys(pausedStates).forEach(reelId => {
            pausedStates[reelId] = false;
          });
          return pausedStates;
        });
        
        setIsVideoPlaying(false);
        pauseAllVideosDirectly();
      };
    }, [reels, currentVideoIndex, globalAudioOn, refetch, refetchAdvertisements])
  );

  // Simplified video state monitoring (removed excessive monitoring to prevent crashes)
  const isOnReelsScreen = useMemo(() => {
    if (!navigationState) return true;
    const currentRoute = navigationState.routes?.[navigationState.index];
    return currentRoute?.name === 'Home';
  }, [navigationState]);

  // Optimized app state and navigation handling
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Pause all videos when app goes to background
        setVideoStates(prev => {
          const pausedStates = { ...prev };
          Object.keys(pausedStates).forEach(reelId => {
            pausedStates[reelId] = false;
          });
          return pausedStates;
        });
        setIsVideoPlaying(false);
        pauseAllVideosDirectly();
        
        // Pause like count polling when app goes to background
        setIsAppInForeground(false);
        if (adLikeCountPollInterval.current) {
          clearInterval(adLikeCountPollInterval.current);
          adLikeCountPollInterval.current = null;
        }
      } else if (nextAppState === 'active') {
        // Resume like count polling when app comes to foreground
        setIsAppInForeground(true);
        if (advertisements.length > 0 && !adLikeCountPollInterval.current) {
          adLikeCountPollInterval.current = setInterval(() => {
            fetchAdvertisementLikeCounts(true); // Force refresh
          }, 30000); // 30 seconds
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [advertisements]);

  // Handle navigation changes
  useEffect(() => {
    if (!isOnReelsScreen) {
      // Pause videos when not on reels screen
      setVideoStates(prev => {
        const pausedStates = { ...prev };
        Object.keys(pausedStates).forEach(reelId => {
          pausedStates[reelId] = false;
        });
        return pausedStates;
      });
      setIsVideoPlaying(false);
      pauseAllVideosDirectly();
    }
  }, [isOnReelsScreen]);


  // Function to get a valid video URL (fallback to sample if API URL fails)
  const getVideoUrl = (item, index) => {
    // If API provides a valid URL, use it
    if (item.videoUrl && item.videoUrl.startsWith('http')) {
      return item.videoUrl;
    }
    
    // Fallback to a default video URL if needed
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  };

  // Function to retry loading a failed video
  const retryVideo = (reelId) => {
    setVideoErrors(prev => ({
      ...prev,
      [reelId]: false
    }));
    // Force a re-render by updating video states
    setVideoStates(prev => ({
      ...prev,
      [reelId]: false
    }));
  };

  // Optimized video pause function
  const pauseAllVideosDirectly = useCallback(async () => {
    try {
      const pausePromises = Object.values(videoRefs.current).map(async (videoRef) => {
        if (videoRef?.current) {
          try {
            await videoRef.current.pauseAsync();
            await videoRef.current.stopAsync();
            await videoRef.current.setPositionAsync(0);
          } catch (error) {
            // Silently handle individual video errors
          }
        }
      });
      
      await Promise.all(pausePromises);
    } catch (error) {
      // Silently handle errors to prevent crashes
    }
  }, []);

  // Optimized video ref cleanup
  const cleanupVideoRefs = useCallback(() => {
    try {
      Object.keys(videoRefs.current).forEach(reelId => {
        const videoRef = videoRefs.current[reelId];
        if (videoRef?.current) {
          try {
            videoRef.current.unloadAsync?.();
          } catch (error) {
            // Silently handle cleanup errors
          }
        }
      });
      videoRefs.current = {};
    } catch (error) {
      // Silently handle cleanup errors
    }
  }, []);

  // Function to restore video playback state
  const restoreVideoPlayback = () => {
    if (reels.length > 0 && currentVideoIndex >= 0) {
      const currentReelId = reels[currentVideoIndex]?._id;
      if (currentReelId) {
        
        // Force a complete video state reset
        setVideoStates(prev => {
          const newStates = {};
          reels.forEach(reel => {
            newStates[reel._id] = reel._id === currentReelId;
          });
          return newStates;
        });
        
        // Restore audio states
        setAudioStates(prev => {
          const newAudioStates = {};
          reels.forEach(reel => {
            newAudioStates[reel._id] = globalAudioOn;
          });
          return newAudioStates;
        });
        
        // Force a re-render by updating current video index
        setCurrentVideoIndex(prev => prev);
        
      }
    }
  };


  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentVideoIndex(0); // Reset to first video
    // Reset global audio state to on when refreshing
    setGlobalAudioOn(true);
    
    // Reset video and audio states
    setVideoStates({});
    setAudioStates({});
    setVideoErrors({});
    setTrackedViews(new Set()); // Reset tracked views on refresh
    setManuallyPausedReelId(null); // Clear manual pause state
    setAutoScrollEnabled(true); // Re-enable auto-scroll
    
    // Reset advertisement like counts and states
    setAdvertisementLikeCounts({});
    setLikedAdvertisements(new Set());
    
    // Reset follow status (will be refetched after reels load)
    setFollowingUsers(new Set());
    setFollowStatusLoading({});
    
    // Refetch all data
    await Promise.all([
      refetch(),
      refetchAdvertisements(),
      refetchAdShowOrderNos(),
      refetchWebLinks()
    ]);
    
    // Force refresh advertisement like counts
    await fetchAdvertisementLikeCounts(true);
    
    setRefreshing(false);

    // Scroll to top after refresh (use setTimeout to ensure data is rendered)
    setTimeout(() => {
      if (flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({ index: 0, animated: true });
        } catch (error) {
          // Fallback to scrollToOffset if scrollToIndex fails
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      }
    }, 100);
  }, [refetch, refetchAdvertisements, refetchAdShowOrderNos, refetchWebLinks, fetchAdvertisementLikeCounts]);



  // No need for handleLoadMore since we're loading all reels at once

  const handleLike = async (reelId) => {
    // Check if user is authenticated
    if (!user) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Authentication Required', 'Please log in to like reels.');
      return;
    }

    // Prevent double-tapping while API call is in progress
    if (isLikeLoading) {
      return;
    }

    try {
      // Optimistically update UI
      const isCurrentlyLiked = likedReels.has(reelId);
      const currentCount = likeCounts[reelId] || 0;
      
      // Add haptic feedback
      if (isCurrentlyLiked) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      setLikedReels(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(reelId);
        } else {
          newSet.add(reelId);
        }
        return newSet;
      });
      
      // Optimistically update like count
      setLikeCounts(prev => ({
        ...prev,
        [reelId]: isCurrentlyLiked ? currentCount - 1 : currentCount + 1
      }));
      // Make API call
      await toggleLike(reelId).unwrap();
      
      // API call successful - no need to revert UI since RTK Query will refetch and update
      // Optional: Show success message
      // Alert.alert('Success', 'Like updated successfully!');
    } catch (error) {
      // Revert optimistic updates on error
      const isCurrentlyLiked = likedReels.has(reelId);
      const currentCount = likeCounts[reelId] || 0;
      
      setLikedReels(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(reelId);
        } else {
          newSet.add(reelId);
        }
        return newSet;
      });
      
      setLikeCounts(prev => ({
        ...prev,
        [reelId]: isCurrentlyLiked ? currentCount - 1 : currentCount + 1
      }));
      
      
      // Add haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to update like. Please try again.';
      if (error?.status === 401) {
        errorMessage = 'Please log in to like reels.';
      } else if (error?.status === 404) {
        errorMessage = 'Reel not found.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleAdvertisementLike = async (advertisementId) => {
    // Check if user is authenticated
    if (!user) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Authentication Required', 'Please log in to like advertisements.');
      return;
    }

    // Prevent double-tapping while API call is in progress
    if (isAdvertisementLikeLoading) {
      return;
    }

    try {
      // Optimistically update UI
      const isCurrentlyLiked = likedAdvertisements.has(advertisementId);
      const currentCount = advertisementLikeCounts[advertisementId] || 0;
      
      // Add haptic feedback
      if (isCurrentlyLiked) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      setLikedAdvertisements(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(advertisementId);
        } else {
          newSet.add(advertisementId);
        }
        return newSet;
      });
      
      // Optimistically update like count
      setAdvertisementLikeCounts(prev => ({
        ...prev,
        [advertisementId]: isCurrentlyLiked ? currentCount - 1 : currentCount + 1
      }));
      
      // Make API call
      await toggleAdvertisementLike(advertisementId).unwrap();
      
      // API call successful - no need to revert UI since RTK Query will refetch and update
    } catch (error) {
      // Revert optimistic updates on error
      const isCurrentlyLiked = likedAdvertisements.has(advertisementId);
      const currentCount = advertisementLikeCounts[advertisementId] || 0;
      
      setLikedAdvertisements(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(advertisementId);
        } else {
          newSet.add(advertisementId);
        }
        return newSet;
      });
      
      setAdvertisementLikeCounts(prev => ({
        ...prev,
        [advertisementId]: isCurrentlyLiked ? currentCount - 1 : currentCount + 1
      }));
      
      
      // Add haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to update like. Please try again.';
      if (error?.status === 401) {
        errorMessage = 'Please log in to like advertisements.';
      } else if (error?.status === 404) {
        errorMessage = 'Advertisement not found.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const safeAlert = useCallback((title, message) => {
    if (AppState.currentState === 'active') {
      Alert.alert(title, message);
    }
  }, []);

  const ensureShareSheet = useCallback(async (sharePayload, shareOptions) => {
    if (!sharePayload || (typeof sharePayload !== 'object')) {
      throw new Error('Invalid share payload');
    }

    const payloadWithMessage = sharePayload.message || sharePayload.url
      ? sharePayload
      : { ...sharePayload, message: 'Check this out!' };
    
    // Only keep keys supported by React Native Share API
    const sanitizedPayload = Object.fromEntries(
      Object.entries(payloadWithMessage).filter(([key]) =>
        ['message', 'title', 'url', 'subject'].includes(key)
      )
    );

    if (AppState.currentState !== 'active') {
      await new Promise((resolve) => {
        let resolved = false;
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            subscription?.remove?.();
            resolve();
          }
        }, 750);

        const subscription = AppState.addEventListener('change', (state) => {
          if (state === 'active' && !resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            subscription.remove();
            resolve();
          }
        });
      });
    }

    await new Promise((resolve) => InteractionManager.runAfterInteractions(resolve));

    let sanitizedOptions;

    if (Platform.OS === 'android' && shareOptions) {
      sanitizedOptions = shareOptions.dialogTitle
        ? { dialogTitle: shareOptions.dialogTitle }
        : undefined;
    } else if (Platform.OS === 'ios' && shareOptions) {
      sanitizedOptions = Object.fromEntries(
        Object.entries(shareOptions).filter(([key]) =>
          ['subject', 'excludedActivityTypes', 'tintColor', 'anchor'].includes(key)
        )
      );
    }

    return Share.share(sanitizedPayload, sanitizedOptions);
  }, []);

  const handleShare = async (reel) => {
    try {
      // Add haptic feedback for share action
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Prepare share content with better formatting
      const userName = reel.userId?.name || 'User';
      const reelCaption = reel.caption || 'Check out this amazing reel!';
      
      // Get API base URL
      const apiBaseUrl = BASE_URL;
      // Extract base domain (remove /api/v1)
      const baseDomain = apiBaseUrl.replace(/\/api\/v1$/, '');
      
      const deepLinkUrl = ExpoLinking.createURL(`/reel/${reel._id}`, { scheme: APP_SCHEME });
      
      // For local testing, use deep link directly
      // For production, use web URL that redirects to the app
      const isLocalhost = baseDomain.includes('localhost') || baseDomain.includes('127.0.0.1') || baseDomain.includes('192.168.');
      const shareUrl = isLocalhost || !baseDomain
        ? deepLinkUrl // Use deep link directly for local testing
        : `${baseDomain}/share/reel/${reel._id}`; // Use web URL for production
      
      // Create share message with web URL
      // The web URL can redirect to the app when clicked
      const shareMessage = `🎬 ${reelCaption}\n\nBy: ${userName}\n\nWatch this reel in the app!\n\n${shareUrl}\n\n#Reels #Video #Creative`;
      const shortMessage = `🎬 ${reelCaption}\n\nBy: ${userName}\n\n${shareUrl}`;
      
      // Enhanced share options with better platform support
      // Use web URL that can redirect to the app
      const sharePayload = {
        message: shareMessage,
        url: shareUrl,
        title: `Reel by ${userName}`,
      };
      
      const shareDialogOptions = {
        dialogTitle: Platform.OS === 'android' ? 'Share Reel' : undefined,
        excludedActivityTypes: Platform.OS === 'ios'
          ? [
              'com.apple.UIKit.activity.Print',
              'com.apple.UIKit.activity.AssignToContact',
              'com.apple.UIKit.activity.SaveToCameraRoll',
              'com.apple.UIKit.activity.AddToReadingList',
            ]
          : undefined,
        subject: Platform.OS === 'ios' ? `Check out this reel by ${userName}` : undefined,
      };
      
      const result = await ensureShareSheet(sharePayload, shareDialogOptions);
      
      if (result.action === Share.sharedAction) {
        
        // Track share analytics using RTK Query
        try {
          const result = await trackShare(reel._id).unwrap();
          
          // Optional: Update local share count for immediate UI feedback
          // Note: This would require state management for optimistic updates
          // For now, the share count will update on next data fetch
          
        } catch (analyticsError) {
          
          // Log specific error details for debugging
          if (analyticsError?.data?.message) {
          }
          if (analyticsError?.status) {
          }
        }
        
        // Show success feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Optional: Show a brief success message
        // You can implement a toast notification here if needed
        
      } else if (result.action === Share.dismissedAction) {
        // Optional: Add haptic feedback for dismissal
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
    } catch (error) {
      
      // Add haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Show more specific error messages
      let errorMessage = 'Unable to share this reel. Please try again.';
      let errorTitle = 'Share Error';
      
      if (error.message?.includes('not available')) {
        errorMessage = 'Sharing is not available on this device.';
        errorTitle = 'Sharing Unavailable';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please check your app permissions.';
        errorTitle = 'Permission Denied';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
        errorTitle = 'Network Error';
      }
      
      console.error('Reel share failed:', error);

      safeAlert(
        errorTitle,
        errorMessage
      );
    }
  };

  const handleAdvertisementShare = async (advertisement) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const companyName = advertisement.companyName || 'Advertisement';
      const description = advertisement.advertisementDescription || 'Check out this offer!';
      const shareLink = advertisement.link || advertisement.deeplink || '';

      const shareMessage = `${companyName}\n\n${description}${shareLink ? `\n\n${shareLink}` : ''}`;

      const sharePayload = shareLink
        ? { message: shareMessage, url: shareLink, title: companyName }
        : { message: shareMessage, title: companyName };

      const shareOptions =
        Platform.OS === 'android'
          ? { dialogTitle: 'Share Advertisement' }
          : { subject: companyName };

      await ensureShareSheet(sharePayload, shareOptions);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      console.error('Advertisement share failed:', error);

      safeAlert(
        'Share Error',
        'Unable to share this advertisement right now. Please try again.'
      );
    }
  };

  // Handle follow/unfollow user
  const handleFollowToggle = async (userId) => {
    // Check if user is authenticated
    if (!user) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Authentication Required', 'Please log in to follow users.');
      return;
    }

    // Don't allow following yourself
    if (user.id === userId || user._id === userId) {
      return;
    }

    // Prevent double-tapping while API call is in progress
    if (isFollowLoading || isUnfollowLoading || followStatusLoading[userId]) {
      return;
    }

    // Validate userId
    if (!userId || typeof userId !== 'string') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Invalid user ID.');
      return;
    }

    const isCurrentlyFollowing = followingUsers.has(userId);

    try {
      // Optimistically update UI
      setFollowStatusLoading(prev => ({ ...prev, [userId]: true }));
      
      // Add haptic feedback
      if (isCurrentlyFollowing) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Optimistically update follow state
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowing) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });

      // Make API call
      let result;
      if (isCurrentlyFollowing) {
        result = await unfollowUser(userId).unwrap();
      } else {
        result = await followUser(userId).unwrap();
      }

      // Check if API call was successful
      if (result && (result.success === false || result.status === 0)) {
        throw new Error(result.message || 'Follow operation failed');
      }

      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Revert optimistic update on error
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowing) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });

      // Add haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Provide more specific error messages
      let errorMessage = 'Failed to update follow status. Please try again.';
      const errorStatus = error?.status || error?.data?.status || error?.originalStatus;
      const errorData = error?.data || {};
      
      if (errorStatus === 401 || errorData.status === 0 && errorData.message?.toLowerCase().includes('auth')) {
        errorMessage = 'Please log in to follow users.';
      } else if (errorStatus === 404 || errorData.message?.toLowerCase().includes('not found')) {
        errorMessage = 'User not found.';
      } else if (errorStatus === 500 || errorData.status === 0 && errorData.message?.toLowerCase().includes('server')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      if (AppState.currentState === 'active') {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setFollowStatusLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Fetch follow status for users in reels
  useEffect(() => {
    if (!user || reels.length === 0) return;

    const fetchFollowStatuses = async () => {
      try {
        const uniqueUserIds = [...new Set(reels.map(reel => reel.userId?._id).filter(Boolean))];
        
        // Filter out current user's own ID (check both user.id and user._id)
        const currentUserId = user.id || user._id;
        const otherUserIds = uniqueUserIds.filter(id => id !== currentUserId && id !== user.id && id !== user._id);

        if (otherUserIds.length === 0) return;

        // Fetch follow status for each user
        const statusPromises = otherUserIds.map(async (userId) => {
          try {
            const response = await fetch(
              `${BASE_URL}/users/${userId}/follow-status`,
              {
                headers: {
                  'Authorization': `Bearer ${await tokenStorage.getAccessToken()}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (response.ok) {
              const data = await response.json();
              // Check multiple possible response formats
              const isFollowing = data.data?.isFollowing || data.isFollowing || false;
              return { userId, isFollowing };
            }
            return { userId, isFollowing: false };
          } catch (error) {
            return { userId, isFollowing: false };
          }
        });

        const results = await Promise.all(statusPromises);
        
        // Merge with existing follow status instead of replacing
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          results.forEach(({ userId, isFollowing }) => {
            if (isFollowing) {
              newSet.add(userId);
            } else {
              newSet.delete(userId);
            }
          });
          return newSet;
        });
      } catch (error) {
        // Silently handle errors
      }
    };

    fetchFollowStatuses();
  }, [reels, user]);



  const handleVideoPress = (reelId) => {
    // Find the clicked video index
    const clickedIndex = reels.findIndex(reel => reel._id === reelId);
    
    // Check if this is a manual pause/play action on the current video
    const isCurrentVideo = clickedIndex === currentVideoIndex;
    const isCurrentlyPlaying = videoStates[reelId] || false;
    
    // Update current video index if needed
    if (clickedIndex !== -1 && clickedIndex !== currentVideoIndex) {
      setCurrentVideoIndex(clickedIndex);
      // Clear manual pause when switching to a different video
      setManuallyPausedReelId(null);
      // Re-enable auto-scroll when switching videos
      setAutoScrollEnabled(true);
      
      // Update video states to play the new video
      setVideoStates(prev => {
        const newStates = {};
        reels.forEach(reel => {
          // Only the clicked video should play, all others should pause
          newStates[reel._id] = reel._id === reelId;
        });
        return newStates;
      });
    } else if (isCurrentVideo) {
      // Toggle play/pause for the current video
      const newPlayingState = !isCurrentlyPlaying;
      
      setVideoStates(prev => {
        const newStates = { ...prev };
        newStates[reelId] = newPlayingState;
        return newStates;
      });
      
      // If user manually paused the current video, disable auto-scroll
      if (!newPlayingState) {
        // User manually paused the video
        setManuallyPausedReelId(reelId);
        setAutoScrollEnabled(false);
      } else if (manuallyPausedReelId === reelId) {
        // User manually resumed the video that was previously paused
        setManuallyPausedReelId(null);
        setAutoScrollEnabled(true);
      }
    }
  };

  const handleAudioToggle = (reelId) => {
    const newAudioState = !audioStates[reelId];
    
    // Instagram-like behavior: If turning off audio for one video, turn off audio for all videos
    // If turning on audio for one video, turn on audio for all videos
    if (!newAudioState) {
      setGlobalAudioOn(false);
      const allAudioOff = {};
      reels.forEach(reel => {
        allAudioOff[reel._id] = false;
      });
      setAudioStates(allAudioOff);
      
      // Optional: Add haptic feedback or toast message
    } else {
      setGlobalAudioOn(true);
      const allAudioOn = {};
      reels.forEach(reel => {
        allAudioOn[reel._id] = true;
      });
      setAudioStates(allAudioOn);
      
      // Optional: Add haptic feedback or toast message
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    try {
      if (viewableItems.length === 0 || !reels.length) return;
      
      const newIndex = viewableItems[0].index;
      
      // Only update if the index actually changed
      if (newIndex !== currentVideoIndex && newIndex >= 0 && newIndex < reels.length) {
        setCurrentVideoIndex(newIndex);
        setLastManualScroll(Date.now());
        
        // Clear manual pause state when scrolling to a new video
        setManuallyPausedReelId(null);
        // Re-enable auto-scroll when scrolling to a new video
        setAutoScrollEnabled(true);
        
        // Check if current item is a video or advertisement
        if (shouldShowAdvertisement(newIndex)) {
          // Pause all videos for advertisement
          setVideoStates(prev => {
            const pausedStates = { ...prev };
            Object.keys(pausedStates).forEach(reelId => {
              pausedStates[reelId] = false;
            });
            return pausedStates;
          });
        } else {
          // Play current video and pause others
          const currentReelId = reels[newIndex]?._id;
          if (currentReelId) {
            setVideoStates(prev => {
              const newStates = { ...prev };
              Object.keys(newStates).forEach(reelId => {
                newStates[reelId] = reelId === currentReelId;
              });
              return newStates;
            });
            
            setAudioStates(prev => {
              const newAudioStates = { ...prev };
              Object.keys(newAudioStates).forEach(reelId => {
                newAudioStates[reelId] = globalAudioOn;
              });
              return newAudioStates;
            });
          }
        }
      }
    } catch (error) {
    }
  }, [currentVideoIndex, reels, globalAudioOn]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Video starts playing when 50% visible
    minimumViewTime: 50, // Minimum time item must be visible (ms)
  }).current;

  // Optimized callbacks for ReelItem
  const handleVideoError = useCallback((reelId) => {
    setVideoErrors(prev => ({
      ...prev,
      [reelId]: true
    }));
  }, []);

  const handleVideoLoadStart = useCallback((reelId) => {
    setVideoErrors(prev => ({
      ...prev,
      [reelId]: false
    }));
  }, []);

  const handleVideoLoad = useCallback((reelId) => {
    setVideoErrors(prev => ({
      ...prev,
      [reelId]: false
    }));
  }, []);

  const handlePlaybackStatusUpdate = useCallback((reelId, status) => {
    if (status.isLoaded) {
      if (status.error) {
        setVideoErrors(prev => ({
          ...prev,
          [reelId]: true
        }));
      }
      
      // Track view when video starts playing (only once per reel)
      if (status.isPlaying && !trackedViews.has(reelId)) {
        setTrackedViews(prev => {
          const newSet = new Set(prev);
          newSet.add(reelId);
          return newSet;
        });
        
        // Track view in background (don't await to avoid blocking)
        trackView(reelId).catch(error => {
          // Silently handle errors - view tracking is not critical
        });
      }
      
      // Auto-scroll to next video when current video finishes
      // Only auto-scroll if the video wasn't manually paused by the user
      if (status.didJustFinish && manuallyPausedReelId !== reelId) {
        // Clear any existing timeout
        if (timeoutRefs.current.videoFinish) {
          clearTimeout(timeoutRefs.current.videoFinish);
        }
        
        // Add delay to prevent rapid state updates
        timeoutRefs.current.videoFinish = setTimeout(() => {
          autoScrollToNext();
        }, 100);
      }
    }
  }, [trackedViews, trackView, autoScrollToNext, manuallyPausedReelId]);

  const handleCommentPress = useCallback((reelId) => {
    navigation.navigate('Comments', { reelId });
  }, [navigation]);

  const handleUserProfilePress = useCallback((userId) => {
    if (userId) {
      navigation.navigate('UserProfile', { userId });
    }
  }, [navigation]);

  const renderReel = useCallback(({ item, index }) => {
    const isLiked = likedReels.has(item._id);
    const isCurrentVideo = index === currentVideoIndex;
    const isPlaying = videoStates[item._id] || false;
    const isAudioOn = audioStates[item._id] !== false && globalAudioOn;
    const isVideoError = videoErrors[item._id] || false;
    const commentCount = item.commentsCount || 0;
    const likeCount = likeCounts[item._id] !== undefined ? likeCounts[item._id] : (item.likes?.length || 0);
    
    const userId = item.userId?._id;
    const isFollowing = userId ? followingUsers.has(userId) : false;
    const isOwnProfile = user && userId && (user.id === userId || user._id === userId);
    const isLoadingFollow = userId ? followStatusLoading[userId] : false;

    return (
      <ReelItem
        item={item}
        index={index}
        isLiked={isLiked}
        likeCount={likeCount}
        commentCount={commentCount}
        isPlaying={isPlaying}
        isAudioOn={isAudioOn}
        isVideoError={isVideoError}
        isFollowing={isFollowing}
        isOwnProfile={isOwnProfile}
        isLoadingFollow={isLoadingFollow}
        isLikeLoading={isLikeLoading}
        isCurrentVideo={isCurrentVideo}
        trackedViews={trackedViews}
        onLike={handleLike}
        onComment={handleCommentPress}
        onShare={handleShare}
        onFollowToggle={handleFollowToggle}
        onVideoPress={handleVideoPress}
        onAudioToggle={handleAudioToggle}
        onUserProfilePress={handleUserProfilePress}
        onVideoError={(error) => handleVideoError(item._id)}
        onVideoLoadStart={() => handleVideoLoadStart(item._id)}
        onVideoLoad={() => handleVideoLoad(item._id)}
        onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(item._id, status)}
        onRetryVideo={retryVideo}
        onVideoRef={(ref) => {
          if (ref) {
            videoRefs.current[item._id] = ref;
          }
        }}
        globalAudioOn={globalAudioOn}
      />
    );
  }, [
    likedReels,
    currentVideoIndex,
    videoStates,
    audioStates,
    globalAudioOn,
    videoErrors,
    likeCounts,
    followingUsers,
    followStatusLoading,
    user,
    isLikeLoading,
    trackedViews,
    handleLike,
    handleCommentPress,
    handleShare,
    handleFollowToggle,
    handleVideoPress,
    handleAudioToggle,
    handleUserProfilePress,
    handleVideoError,
    handleVideoLoadStart,
    handleVideoLoad,
    handlePlaybackStatusUpdate,
    retryVideo,
  ]);

  // Auto-scroll functionality for advertisement banners
  const startAdBannerAutoScroll = useCallback((adId, bannerCount) => {
    if (bannerCount <= 1) return;
    
    // Clear existing interval for this ad
    if (intervalRefs.current[`ad_${adId}`]) {
      clearInterval(intervalRefs.current[`ad_${adId}`]);
    }
    
    // Start auto-scroll every 3 seconds
    intervalRefs.current[`ad_${adId}`] = setInterval(() => {
      setAdBannerScrollIndex(prev => {
        const currentIndex = prev[adId] || 0;
        const nextIndex = (currentIndex + 1) % bannerCount;
        
        // Scroll to next image
        if (adBannerScrollRefs.current[adId]) {
          adBannerScrollRefs.current[adId].scrollTo({
            x: nextIndex * screenWidth,
            animated: true
          });
        }
        
        return { ...prev, [adId]: nextIndex };
      });
    }, 3000);
  }, []);

  // Stop auto-scroll for advertisement banners
  const stopAdBannerAutoScroll = useCallback((adId) => {
    if (intervalRefs.current[`ad_${adId}`]) {
      clearInterval(intervalRefs.current[`ad_${adId}`]);
      delete intervalRefs.current[`ad_${adId}`];
    }
  }, []);

  // Handle scroll events for advertisement banners
  const handleAdBannerScroll = useCallback((adId, event) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(scrollX / screenWidth);
    
    setAdBannerScrollIndex(prev => ({
      ...prev,
      [adId]: currentIndex
    }));
  }, []);

  // Optimized callbacks for AdvertisementItem
  const handleAdCommentPress = useCallback((advertisementId) => {
    navigation.navigate('AdvertisementComments', { advertisementId });
  }, [navigation]);

  const handleAdBannerScrollCallback = useCallback((adId, event) => {
    handleAdBannerScroll(adId, event);
  }, []);

  const handleAdScrollBeginDrag = useCallback((adId) => {
    stopAdBannerAutoScroll(adId);
  }, []);

  const handleAdScrollEndDrag = useCallback((adId, bannerCount) => {
    startAdBannerAutoScroll(adId, bannerCount);
  }, []);

  const renderAdvertisement = useCallback(({ item, index }) => {
    if (!item || !item.companyName) {
      return null;
    }

    const adId = item._id || `ad_${index}`;
    const currentBannerIndex = adBannerScrollIndex[adId] || 0;
    const bannerCount = item.bannerUrl?.length || 0;
    const commentCount = item.advertisementCommentsCount || 0;
    const likeCount = advertisementLikeCounts[item._id] || 0;
    const isLiked = likedAdvertisements.has(item._id);

    return (
      <AdvertisementItem
        item={item}
        index={index}
        isLiked={isLiked}
        likeCount={likeCount}
        commentCount={commentCount}
        isAdvertisementLikeLoading={isAdvertisementLikeLoading}
        currentBannerIndex={currentBannerIndex}
        onLike={handleAdvertisementLike}
        onComment={handleAdCommentPress}
        onShare={handleAdvertisementShare}
        onUserProfilePress={handleUserProfilePress}
        onBannerScroll={(event) => handleAdBannerScrollCallback(adId, event)}
        onScrollBeginDrag={() => handleAdScrollBeginDrag(adId)}
        onScrollEndDrag={() => handleAdScrollEndDrag(adId, bannerCount)}
        onBannerScrollRef={(ref) => {
          if (ref) {
            adBannerScrollRefs.current[adId] = ref;
          }
        }}
      />
    );
  }, [
    adBannerScrollIndex,
    advertisementLikeCounts,
    likedAdvertisements,
    isAdvertisementLikeLoading,
    handleAdvertisementLike,
    handleAdCommentPress,
    handleAdvertisementShare,
    handleUserProfilePress,
    handleAdBannerScrollCallback,
    handleAdScrollBeginDrag,
    handleAdScrollEndDrag,
  ]);

  // Effect to manage auto-scroll for advertisement banners
  useEffect(() => {
    // Start auto-scroll for all advertisements when component mounts
    if (advertisements.length > 0) {
      // Add a small delay to ensure the component is fully rendered
      const timeoutId = setTimeout(() => {
        advertisements.forEach(ad => {
          const adId = ad._id || `ad_${advertisements.indexOf(ad)}`;
          const bannerCount = ad.bannerUrl?.length || 0;
          if (bannerCount > 1) {
            startAdBannerAutoScroll(adId, bannerCount);
          }
        });
      }, 1000); // 1 second delay

      return () => {
        clearTimeout(timeoutId);
        // Stop all advertisement auto-scroll intervals
        Object.keys(intervalRefs.current).forEach(key => {
          if (key.startsWith('ad_')) {
            clearInterval(intervalRefs.current[key]);
            delete intervalRefs.current[key];
          }
        });
      };
    }

    // Cleanup function
    return () => {
      // Stop all advertisement auto-scroll intervals
      Object.keys(intervalRefs.current).forEach(key => {
        if (key.startsWith('ad_')) {
          clearInterval(intervalRefs.current[key]);
          delete intervalRefs.current[key];
        }
      });
    };
  }, [advertisements, startAdBannerAutoScroll]);

  // Memoized key extractor and item layout for FlatList performance
  const keyExtractor = useCallback((item) => item._id, []);
  
  const getItemLayout = useCallback((data, index) => ({
    length: screenHeight - 150,
    offset: (screenHeight - 150) * index,
    index,
  }), []);

  const renderItem = useCallback(({ item, index }) => {
    // Check if we should show an advertisement at this index
    if (shouldShowAdvertisement(index)) {
      const advertisement = getAdvertisementForIndex(index);
      
      // If we have a valid advertisement, render it
      if (advertisement) {
        return renderAdvertisement({ item: advertisement, index });
      }
      
      // If no advertisement available, render the reel instead
      return renderReel({ item, index });
    }
    
    // Normal reel rendering
    return renderReel({ item, index });
  }, [shouldShowAdvertisement, getAdvertisementForIndex, renderAdvertisement, renderReel]);

  // No footer needed since we load all reels at once

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading amazing reels...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color={COLORS.error} />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>
          {error?.data?.message || error?.message || "Failed to load reels"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
    return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
        hidden={false}
      />
      {/* Simple Header with Filter Tags */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          {/* Back Button - Show when navigating from profile */}
          {directRouteUserId && (
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => {
                navigation.navigate('UserProfile', { userId: directRouteUserId });
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <View style={styles.headerBackButtonCircle}>
                <Ionicons name="arrow-back" size={20} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          )}
          
          {/* Search Toggle Button */}
          <TouchableOpacity
            style={styles.searchToggleButton}
            onPress={() => setIsSearchVisible(!isSearchVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isSearchVisible ? "close" : "search"} 
              size={24} 
              color={COLORS.white} 
            />
          </TouchableOpacity>
          
          {/* web links Tags */}
        <ScrollView
          ref={webLinksScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
          style={styles.filterScrollView}
          scrollEventThrottle={16}
          onScroll={(event) => {
            // Update scroll position when user manually scrolls
            webLinksScrollPosition.current = event.nativeEvent.contentOffset.x;
          }}
          onScrollBeginDrag={() => {
            // Pause auto-scroll when user manually scrolls
            if (webLinksAutoScrollInterval.current) {
              clearInterval(webLinksAutoScrollInterval.current);
              webLinksAutoScrollInterval.current = null;
            }
          }}
          onScrollEndDrag={() => {
            // Resume auto-scroll after user stops scrolling (after 2 seconds)
            if (webLinks.length > 1 && webLinksScrollRef.current) {
              setTimeout(() => {
                const scrollStep = 1;
                const scrollInterval = 50;
                
                webLinksAutoScrollInterval.current = setInterval(() => {
                  if (webLinksScrollRef.current) {
                    webLinksScrollPosition.current += scrollStep;
                    const estimatedContentWidth = webLinks.length * 162;
                    const maxScroll = Math.max(0, estimatedContentWidth - screenWidth);
                    
                    if (webLinksScrollPosition.current > maxScroll) {
                      webLinksScrollPosition.current = 0;
                      webLinksScrollRef.current.scrollTo({
                        x: 0,
                        animated: false,
                      });
                    } else {
                      webLinksScrollRef.current.scrollTo({
                        x: webLinksScrollPosition.current,
                        animated: false,
                      });
                    }
                  }
                }, scrollInterval);
              }, 2000);
            }
          }}
        >
          {isWebLinksLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : webLinks.length > 0 ? (
            webLinks.map((link) => (
              <TouchableOpacity
                key={link._id}
                style={styles.filterTag}
                onPress={() => {
                  if (link.webSiteLink) {
                    Linking.openURL(link.webSiteLink).catch(err => {
                      console.error('Failed to open URL:', err);
                    });
                  }
                }}
              >
                {link.logoImage && link.logoImage.trim() !== '' ? (
                  <Image
                    source={{ uri: link.logoImage }}
                    style={styles.filterTagLogo}
                    resizeMode="contain"
                    onError={() => {}}
                  />
                ) : null}
                <Text style={styles.filterTagText}>{link.webSiteLinkTitle || 'Link'}</Text>
              </TouchableOpacity>
            ))
          ) : null}
        </ScrollView>
        </View>
      </View>
       
       {/* Search Bar - Show when search is visible */}
       {isSearchVisible && (
         <View style={styles.searchContainer}>
           <View style={styles.searchInputContainer}>
             <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
             <TextInput
               style={styles.searchInput}
               placeholder="Search by name..."
               placeholderTextColor={COLORS.textSecondary}
               value={searchName}
               onChangeText={setSearchName}
               autoCapitalize="none"
               autoCorrect={false}
             />
             {searchName.length > 0 && (
               <TouchableOpacity
                 onPress={() => setSearchName('')}
                 hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
               >
                 <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
               </TouchableOpacity>
             )}
           </View>
           <View style={styles.searchInputContainer}>
             <Ionicons name="text-outline" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
             <TextInput
               style={styles.searchInput}
               placeholder="Search by caption..."
               placeholderTextColor={COLORS.textSecondary}
               value={searchCaption}
               onChangeText={setSearchCaption}
               autoCapitalize="none"
               autoCorrect={false}
             />
             {searchCaption.length > 0 && (
               <TouchableOpacity
                 onPress={() => setSearchCaption('')}
                 hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
               >
                 <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
               </TouchableOpacity>
             )}
           </View>
           {(searchName || searchCaption) && (
             <TouchableOpacity
               style={styles.clearSearchButton}
               onPress={() => {
                 setSearchName('');
                 setSearchCaption('');
               }}
             >
               <Text style={styles.clearSearchButtonText}>Clear All</Text>
             </TouchableOpacity>
           )}
         </View>
       )}

       {/* Optimized Reels Feed */}
       <FlatList
         ref={flatListRef}
         data={reels}
         renderItem={renderItem}
         keyExtractor={keyExtractor}
         pagingEnabled
         showsVerticalScrollIndicator={false}
         snapToInterval={screenHeight - 150}
         snapToAlignment="start"
         decelerationRate="fast"
         onViewableItemsChanged={onViewableItemsChanged}
         viewabilityConfig={viewabilityConfig}
         scrollEventThrottle={16}
         getItemLayout={getItemLayout}
         removeClippedSubviews={true}
         maxToRenderPerBatch={2}
         windowSize={3}
         initialNumToRender={1}
         updateCellsBatchingPeriod={100}
         disableIntervalMomentum={true}
         disableScrollViewPanResponder={false}
         refreshControl={
           <RefreshControl
             refreshing={refreshing}
             onRefresh={handleRefresh}
             colors={[COLORS.primary]}
             tintColor={COLORS.primary}
           />
         }
         ListEmptyComponent={
           <View style={styles.emptyContainer}>
             <Ionicons name="videocam-outline" size={80} color={COLORS.textSecondary} />
             <Text style={styles.emptyTitle}>No Reels Yet</Text>
             <Text style={styles.emptyMessage}>
               Be the first to create amazing reels and share your creativity with the world!
             </Text>
           </View>
         }
      />
     </View>
 );
}

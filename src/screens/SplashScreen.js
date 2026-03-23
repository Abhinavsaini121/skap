import { ActivityIndicator, View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectIsAuthenticated, selectIsPersistenceReady, setUser, tokenValidationFailed } from "../../store/authSlice";
import { useEffect, useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeOut
} from "react-native-reanimated";
import COLORS from "../../constants/colors";
import { useGetProfileQuery } from "../../services/authApi";
import { tokenStorage } from "../../utils/tokenStorage";
import { useNavigation } from "@react-navigation/native";

const { width: screenWidth } = Dimensions.get("window");

// Animated dot component for loading indicator
function AnimatedDot({ index }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, delay: index * 200 }),
        withTiming(0.3, { duration: 600 })
      ),
      -1,
      true
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export default function SplashScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [forceContinue, setForceContinue] = useState(false);
  const [hasCheckedToken, setHasCheckedToken] = useState(false);
  const [storedToken, setStoredToken] = useState(null);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isPersistenceReady = useSelector(selectIsPersistenceReady);
  
  // Check for token and restore session if token exists
  const { data: userProfile, error: profileError, isLoading: profileLoading } = useGetProfileQuery(
    undefined,
    {
      skip: !hasCheckedToken || !storedToken || isAuthenticated,
      refetchOnMountOrArgChange: false,
    }
  );

  // Animation values
  const pulseScale = useSharedValue(1);
  const rotateValue = useSharedValue(0);
  const fadeValue = useSharedValue(0);

  // Check for stored token immediately
  useEffect(() => {
    const checkStoredToken = async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        setStoredToken(token);
        setHasCheckedToken(true);
      } catch (error) {
        console.error('Error checking stored token:', error);
        setHasCheckedToken(true);
      }
    };

    checkStoredToken();
  }, []);

  // Restore user session when profile is fetched successfully
  useEffect(() => {
    if (userProfile && !isAuthenticated) {
      const user = userProfile?.data || userProfile;
      if (user) {
        dispatch(setUser({ user }));
      }
    }
  }, [userProfile, isAuthenticated, dispatch]);

  // Handle token expiration (401 error)
  useEffect(() => {
    if (profileError) {
      const errorStatus = profileError.status || profileError.originalStatus || profileError.data?.status;
      if (errorStatus === 401 || errorStatus === 403) {
        dispatch(tokenValidationFailed());
        tokenStorage.clearTokens();
      }
    }
  }, [profileError, dispatch]);

  // Initialize animations on mount
  useEffect(() => {
    fadeValue.value = withTiming(1, { duration: 500 });

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    rotateValue.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Handle loading state - wait for token check and profile fetch
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(false);
      navigation.replace('Main');
      return;
    }

    if (!hasCheckedToken) {
      const timeout = setTimeout(() => {
        setHasCheckedToken(true);
      }, 1500);
      return () => clearTimeout(timeout);
    }

    if (!storedToken) {
      setIsLoading(false);
      navigation.replace('Auth');
      return;
    }

    if (storedToken && !isAuthenticated) {
      if (profileLoading) {
        const timeout = setTimeout(() => {
          setIsLoading(false);
        }, 3000);
        return () => clearTimeout(timeout);
      }
      
      if (userProfile || profileError) {
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 200);
        return () => clearTimeout(timer);
      }
    }

    const fallbackTimer = setTimeout(() => {
      setForceContinue(true);
      setIsLoading(false);
    }, 4000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [hasCheckedToken, storedToken, isAuthenticated, profileLoading, userProfile, profileError, navigation]);
  
  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: fadeValue.value,
    };
  });

  const rotateAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateValue.value}deg` }],
    };
  });

  const fadeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeValue.value,
    };
  });
  
  // Show loading screen while waiting for token check or profile fetch
  const shouldShowLoading = (isLoading || !hasCheckedToken || (storedToken && profileLoading)) && !forceContinue;
  
  if (shouldShowLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.backgroundOverlay} />

        <Animated.View
          style={[styles.content, fadeAnimatedStyle]}
          entering={FadeIn.duration(500)}
        >
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <View style={styles.logoBackground}>
              <Image
                source={require("../../assets/images/logoImg.jpeg")}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>

            <Animated.View style={[styles.rotatingRing, rotateAnimatedStyle]}>
              <View style={styles.ringDot} />
            </Animated.View>
          </Animated.View>

          <Animated.Text
            style={[styles.appName, fadeAnimatedStyle]}
            entering={FadeIn.delay(200).duration(500)}
          >
            SpakSpak
          </Animated.Text>

          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((index) => (
              <AnimatedDot key={index} index={index} />
            ))}
          </View>

          <Animated.Text
            style={[styles.hintText, fadeAnimatedStyle]}
            entering={FadeIn.delay(600).duration(500)}
          >
            Please wait while we prepare everything
          </Animated.Text>
        </Animated.View>
      </View>
    );
  }
  
  // Navigation will be handled by useEffect above
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.cardBackground,
    opacity: 0.3,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 140,
    height: 140,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 3,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  rotatingRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    opacity: 0.5,
  },
  ringDot: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: -4,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 48,
    letterSpacing: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: screenWidth * 0.7,
    lineHeight: 20,
  },
});


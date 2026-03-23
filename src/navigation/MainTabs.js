import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import COLORS from '../../constants/colors';
import { useAuthCheck } from '../../hooks/useAuthCheck';
import { homeRefreshRef } from './homeRefreshRef';
import HomeScreen from '../screens/HomeScreen';
import CreateScreen from '../screens/CreateScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import UploadAudioScreen from '../screens/UploadAudioScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const { isChecking, isAuthenticated } = useAuthCheck();
  const navigation = useNavigation();
  const currentTabRef = useRef('Home'); // Track current tab

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      navigation.replace('Auth');
    }
  }, [isChecking, isAuthenticated, navigation]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Don't render tabs if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerTitleStyle: {
          color: COLORS.textPrimary,
          fontWeight: '600',
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: COLORS.cardBackground,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: 5,
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Check if we're already on the home tab using our ref
            const isOnHomeTab = currentTabRef.current === 'Home';

            if (isOnHomeTab) {
              // Prevent default navigation to stay on Home tab
              e.preventDefault();

              // Call the refresh function if it exists
              if (homeRefreshRef.current) {
                homeRefreshRef.current();
              }
            } else {
              // Update ref to Home since we're navigating to it
              currentTabRef.current = 'Home';
              // Let default navigation happen (navigate to Home)
            }
          },
          focus: () => {
            // Update ref when Home tab gains focus
            currentTabRef.current = 'Home';
          },
        }}
      />
     
      <Tab.Screen
        name="UploadAudio"
        component={UploadAudioScreen}
        options={{
          title: 'Audios',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          focus: () => {
            currentTabRef.current = 'UploadAudio';
          },
        }}
      />

      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          focus: () => {
            currentTabRef.current = 'Create';
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          focus: () => {
            currentTabRef.current = 'Profile';
          },
        }}
      />
   
    </Tab.Navigator>
  );
}


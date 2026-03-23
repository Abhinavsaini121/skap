import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import COLORS from '../constants/colors';

export default function ReelDeepLinkRedirect() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const targetReelId = useMemo(() => {
    const rawValue = params?.reelId;

    if (Array.isArray(rawValue)) {
      return rawValue[0];
    }

    if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
      return rawValue.trim();
    }

    return undefined;
  }, [params]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        if (targetReelId) {
          navigation.replace('Main', { screen: 'Home', params: { reelId: targetReelId } });
        } else {
          navigation.replace('Main');
        }
      } catch (navigationError) {
        navigation.replace('Main');
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [navigation, targetReelId]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});


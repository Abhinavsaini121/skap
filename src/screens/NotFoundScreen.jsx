import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function NotFoundScreen() {
  const navigation = useNavigation();
  
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>This screen does not exist.</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.link}>
        <Text style={{ color: '#2e5a2e' }}>Go to home screen!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});

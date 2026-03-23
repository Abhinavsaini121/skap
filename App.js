import React from 'react';
import { AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { store, persistor } from './store/store';
import RootNavigator from './src/navigation/RootNavigator';
import { getStripePublishableKey } from './utils/apiConfig';

const stripePublishableKey = getStripePublishableKey();

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StripeProvider publishableKey={stripePublishableKey || ''}>
          <SafeAreaProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
            <StatusBar style="dark" />
          </SafeAreaProvider>
        </StripeProvider>
      </PersistGate>
    </Provider>
  );
}

// Register the app component
AppRegistry.registerComponent('main', () => App);

export default App;


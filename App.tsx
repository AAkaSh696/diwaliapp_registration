import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ReactNav from './components/routes.jsx';
import store from './redux/store.js';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <Provider store={store}>
        <NavigationContainer>
          <ReactNav />
        </NavigationContainer>
      </Provider>
    </SafeAreaProvider>
  );
}
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ReactNav from './components/routes.web.jsx';
import store from './redux/store.js';

// Maps every screen to a URL so the browser keeps a history entry per screen
// (this is what makes the Back button go to the previous screen).
// Screen names must match the names in routes.web.jsx exactly.
const linking = {
  prefixes: [],
  config: {
    screens: {
      Welcome: '',
      Login: 'login',
      Signup: 'signup',
      registration: 'registration',
      Home: 'home',
      Profile: 'profile',
      Events: 'events',
      adminhome: 'admin',
      verificationpage: 'admin/verify',
      addevent: 'admin/add-event',
      updateevent: 'admin/update-event',
      qrscanner: 'admin/qr-scanner',
      verifiedusers: 'admin/verified-users',
      updatestudent: 'admin/update-student',
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <Provider store={store}>
        <NavigationContainer
          linking={linking}
          documentTitle={{ formatter: () => 'Diwali Haat' }}
        >
          <ReactNav />
        </NavigationContainer>
      </Provider>
    </SafeAreaProvider>
  );
}

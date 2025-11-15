/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import Entypo from '@react-native-vector-icons/entypo';
import StackNavigator from './navigation/StackNavigator';
import {AuthProvider} from './AuthContext';
import {SocketContextProvider} from './SocketContext';
import { ModalPortal } from 'react-native-modals';
import { NotificationProvider } from './context/NotificationContext';
import IncomingCallBanner from './components/IncomingCallBanner';
import { colors } from './utils/theme';

// Global default text color using theme
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = {
  ...(Text.defaultProps.style || {}),
  color: colors.text,
};

function Section({children, title}) {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <AuthProvider>
      <SocketContextProvider>
        <NotificationProvider>
          {/* Global incoming call UI overlay */}
          <IncomingCallBanner />
          <StackNavigator />
        </NotificationProvider>
        <ModalPortal/>
      </SocketContextProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;

import React from 'react';
import {TouchableOpacity, View, StyleSheet, Platform} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const NextButton = ({onPress, placement = 'top-right'}) => {
  const containerStyle = [
    styles.container,
    placement === 'top-right' ? styles.topRight : styles.bottomRight,
  ];
  return (
    <View style={containerStyle} pointerEvents="box-none">
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.button} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="chevron-forward" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 9999,
  },
  topRight: {
    top: Platform.OS === 'android' ? 6 : 6,
    right: 8,
  },
  bottomRight: {
    bottom: 24,
    right: 24,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#581845',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: {width: 0, height: 4},
        }
      : {}),
  },
});

export default NextButton;
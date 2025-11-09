import React from 'react';
import {TouchableOpacity, View, StyleSheet, Platform} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const NextButton = ({onPress}) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.button}>
        <Ionicons name="chevron-forward" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 9999,
    elevation: 9999,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
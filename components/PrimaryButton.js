import React from 'react';
import { Pressable, Text } from 'react-native';
import { colors, radii, spacing } from '../utils/theme';

const PrimaryButton = ({ title, onPress, disabled, style, textStyle }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [{
        backgroundColor: disabled ? '#B794C4' : colors.primary,
        paddingVertical: spacing.md,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.9 : 1,
      }, style]}
    >
      <Text style={[{
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
      }, textStyle]}>{title}</Text>
    </Pressable>
  );
};

export default PrimaryButton;
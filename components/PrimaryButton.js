import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, radii, spacing } from '../utils/theme';
import Ionicons from '@react-native-vector-icons/ionicons';

const PrimaryButton = ({ title, onPress, disabled, style, textStyle, iconName, variant = 'filled' }) => {
  const isOutline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: '#ffffff30' }}
      style={({ pressed }) => [{
        backgroundColor: isOutline ? 'transparent' : (disabled ? '#B794C4' : colors.primary),
        paddingVertical: spacing.md,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.98 : 1,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: isOutline ? 0 : 4,
        borderWidth: isOutline ? 1.5 : 0,
        borderColor: isOutline ? '#ffffff80' : 'transparent',
      }, style]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {iconName && (
          <Ionicons name={iconName} size={18} color={isOutline ? '#fff' : '#fff'} style={{ marginRight: 8 }} />
        )}
        <Text style={[{
          color: colors.white,
          fontSize: 16,
          fontWeight: '700',
        }, textStyle]}>{title}</Text>
      </View>
    </Pressable>
  );
};

export default PrimaryButton;
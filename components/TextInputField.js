import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors, spacing, radii, shadows } from '../utils/theme';

const TextInputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'none',
  icon,
  secure = false,
  error,
  variant = 'light', // 'light' | 'dark'
}) => {
  const [show, setShow] = useState(!secure);
  const isDark = variant === 'dark';
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {!!label && (
        <Text style={{
          fontSize: 13,
          color: isDark ? '#F0E6F5' : colors.textMuted,
          marginBottom: spacing.xs,
          fontWeight: '600'
        }}>{label}</Text>
      )}
      <View style={[{
        borderWidth: 1,
        borderColor: isDark ? '#ffffff40' : colors.border,
        backgroundColor: isDark ? '#ffffff12' : colors.card,
        borderRadius: radii.md,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }, isDark ? {} : shadows.card]}>
        {icon && (
          <Ionicons name={icon} size={20} color={isDark ? '#F0E6F5' : colors.primary} style={{ marginRight: spacing.sm }} />
        )}
        <TextInput
          style={{ flex: 1, color: isDark ? '#fff' : colors.text, fontSize: 15 }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#F0E6F5' : colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={!show && secure}
        />
        {secure && (
          <Pressable onPress={() => setShow(prev => !prev)}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={isDark ? '#F0E6F5' : colors.primary} />
          </Pressable>
        )}
      </View>
      {!!error && (
        <Text style={{ color: colors.danger, fontSize: 12, marginTop: spacing.xs }}>{error}</Text>
      )}
    </View>
  );
};

export default TextInputField;
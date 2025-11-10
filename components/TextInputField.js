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
}) => {
  const [show, setShow] = useState(!secure);
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {!!label && (
        <Text style={{
          fontSize: 13,
          color: colors.textMuted,
          marginBottom: spacing.xs,
          fontWeight: '600'
        }}>{label}</Text>
      )}
      <View style={[{
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        borderRadius: radii.md,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }, shadows.card]}>
        {icon && (
          <Ionicons name={icon} size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
        )}
        <TextInput
          style={{ flex: 1, color: colors.text, fontSize: 15 }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={!show && secure}
        />
        {secure && (
          <Pressable onPress={() => setShow(prev => !prev)}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.primary} />
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
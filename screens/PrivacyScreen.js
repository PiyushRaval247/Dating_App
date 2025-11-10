import React from 'react';
import { SafeAreaView, View, Text, ScrollView, Pressable } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../utils/theme';

const Section = ({ title, children }) => (
  <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{title}</Text>
    <Text style={{ marginTop: spacing.sm, fontSize: 14, lineHeight: 20, color: colors.textMuted }}>{children}</Text>
  </View>
);

const PrivacyScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ marginLeft: spacing.md, fontSize: 20, fontWeight: '700', color: colors.text }}>Privacy</Text>
      </View>
      <View style={{ height: 1, backgroundColor: colors.border }} />
      <ScrollView>
        <Section title="Data Usage">
          We collect basic profile info, photos and prompts to match you with others. Your data is encrypted in transit.
        </Section>
        <Section title="Visibility">
          Your profile is visible only to other registered users. You can hide photos or remove prompts anytime from Edit Profile.
        </Section>
        <Section title="Controls">
          Manage notifications, blocked users and account settings from the Settings page. Contact support if you need account help.
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyScreen;
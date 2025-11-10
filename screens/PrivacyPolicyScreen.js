import React from 'react';
import { SafeAreaView, View, Text, ScrollView, Pressable } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../utils/theme';

const PolicySection = ({ title, children }) => (
  <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{title}</Text>
    <Text style={{ marginTop: spacing.sm, fontSize: 14, lineHeight: 20, color: colors.textMuted }}>{children}</Text>
  </View>
);

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ marginLeft: spacing.md, fontSize: 20, fontWeight: '700', color: colors.text }}>Privacy Policy</Text>
      </View>
      <View style={{ height: 1, backgroundColor: colors.border }} />
      <ScrollView>
        <PolicySection title="Information We Collect">
          Account details, profile content, and usage metrics to support core app functionality.
        </PolicySection>
        <PolicySection title="How We Use Information">
          To personalize matches, improve safety, and provide customer support.
        </PolicySection>
        <PolicySection title="Your Rights">
          You can access, update, or delete your data by contacting support or using in-app settings.
        </PolicySection>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;
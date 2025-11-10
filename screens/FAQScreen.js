import React from 'react';
import { SafeAreaView, View, Text, ScrollView, Pressable } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../utils/theme';

const QA = ({ q, a }) => (
  <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{q}</Text>
    <Text style={{ marginTop: spacing.xs, fontSize: 14, lineHeight: 20, color: colors.textMuted }}>{a}</Text>
  </View>
);

const FAQScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ marginLeft: spacing.md, fontSize: 20, fontWeight: '700', color: colors.text }}>FAQ</Text>
      </View>
      <View style={{ height: 1, backgroundColor: colors.border }} />
      <ScrollView>
        <QA q="How do I edit my profile?" a="Go to Settings → Edit Profile to update photos, prompts and details." />
        <QA q="How do likes and roses work?" a="Tap the heart on photos to like or send roses. Roses are premium compliments." />
        <QA q="How do I block someone?" a="From their profile, open the menu and choose Block. You can manage blocked users in Settings." />
        <QA q="Is my data secure?" a="We use HTTPS for all network requests and follow standard best practices for data handling." />
      </ScrollView>
    </SafeAreaView>
  );
};

export default FAQScreen;
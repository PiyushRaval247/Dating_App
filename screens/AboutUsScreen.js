import React from 'react';
import { SafeAreaView, View, Text, ScrollView, Pressable } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../utils/theme';

const AboutUsScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ marginLeft: spacing.md, fontSize: 20, fontWeight: '700', color: colors.text }}>About Us</Text>
      </View>
      <View style={{ height: 1, backgroundColor: colors.border }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Our Mission</Text>
        <Text style={{ marginTop: spacing.sm, fontSize: 14, lineHeight: 20, color: colors.textMuted }}>
          We help people create meaningful connections through authentic profiles and respectful interactions.
        </Text>
        <Text style={{ marginTop: spacing.lg, fontSize: 16, fontWeight: '600', color: colors.text }}>What We Value</Text>
        <Text style={{ marginTop: spacing.sm, fontSize: 14, lineHeight: 20, color: colors.textMuted }}>
          Transparency, safety, and community. We continuously improve features based on your feedback.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutUsScreen;
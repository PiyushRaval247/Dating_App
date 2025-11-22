import React from 'react';
import { View, Text } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { colors } from '../utils/theme';

const StreakBadge = ({ count = 0, size = 64 }) => {
  const outer = size;
  const inner = Math.round(size * 0.72);
  const fontSize = Math.round(size * 0.28);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: outer, height: outer, borderRadius: outer / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }}>
        <View style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: '#ff7a00', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#ffd580' }}>
          <MaterialDesignIcons name="fire" size={Math.round(size * 0.34)} color="white" />
        </View>
      </View>
      <Text style={{ marginTop: 6, fontWeight: '700', color: colors.text, fontSize }}>{count}</Text>
    </View>
  );
};

export default StreakBadge;

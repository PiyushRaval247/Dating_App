import {View, Text, Pressable} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../utils/theme';

const BackHeader = ({title, right}) => {
  const navigation = useNavigation();
  const onBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main');
    }
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: 'white',
      }}>
      <Pressable onPress={onBack} style={{paddingRight: 6, paddingVertical: 4}}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={{fontSize: 16, fontWeight: '600', color: colors.text}} numberOfLines={1}>
        {title}
      </Text>
      <View style={{minWidth: 24}}>{right}</View>
    </View>
  );
};

export default BackHeader;
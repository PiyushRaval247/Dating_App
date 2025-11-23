import {StyleSheet, Text, View, SafeAreaView} from 'react-native';
import React, {useContext, useMemo} from 'react';
import {useRoute} from '@react-navigation/native';
import ViewProfile from '../components/ViewProfile';
import {AuthContext} from '../AuthContext';
import BackHeader from '../components/BackHeader';

import { colors } from '../utils/theme';
const ProfileDetailScreen = () => {
  const route = useRoute();
  const {setUserInfo, userInfo: ctxUserInfo, userId, token} = useContext(AuthContext);
  const userInfo = useMemo(() => route?.params?.userInfo || ctxUserInfo, [route?.params?.userInfo, ctxUserInfo]);
  return (
    <SafeAreaView style={{flex:1,backgroundColor: colors.card}}> 
      <BackHeader title={userInfo?.firstName || 'Profile'} />

      <ViewProfile userInfo={userInfo} />
    </SafeAreaView>
  );
};

export default ProfileDetailScreen;

const styles = StyleSheet.create({});

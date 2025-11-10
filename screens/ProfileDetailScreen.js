import {StyleSheet, Text, View, SafeAreaView, Dimensions} from 'react-native';
import React, {useState, useContext, useMemo} from 'react';
import {useRoute} from '@react-navigation/native';
import {TabBar, TabView} from 'react-native-tab-view';
import ViewProfile from '../components/ViewProfile';
import {AuthContext} from '../AuthContext';
import BackHeader from '../components/BackHeader';

const ProfileDetailScreen = () => {
  const [index, setIndex] = useState(0);
  const route = useRoute();
  const {setUserInfo, userInfo: ctxUserInfo, userId, token} = useContext(AuthContext);
  const [routes] = useState([
    {key: 'view', title: 'View'},
  ]);
  const userInfo = useMemo(() => route?.params?.userInfo || ctxUserInfo, [route?.params?.userInfo, ctxUserInfo]);
  const renderScene = ({route}) => {
    switch (route.key) {
      case 'view':
        return <ViewProfile userInfo={userInfo} />;
    }
  };
  return (
    <SafeAreaView style={{flex:1,backgroundColor:"white"}}> 
      <BackHeader title={userInfo?.firstName || 'Profile'} />

      <TabView
        navigationState={{index, routes}}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{width: Dimensions.get('window').width}}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{backgroundColor: 'black'}}
            style={{backgroundColor: 'white'}}
            labelStyle={{fontWeight: 'bold'}}
            activeColor="black"
            inactiveColor="gray"
          />
        )}
      />
    </SafeAreaView>
  );
};

export default ProfileDetailScreen;

const styles = StyleSheet.create({});

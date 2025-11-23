import {StyleSheet, Text, View, ScrollView, SafeAreaView, Dimensions} from 'react-native';
import React, {useState} from 'react';
import { useRoute } from '@react-navigation/native';
import {TabBar, TabView} from 'react-native-tab-view';
import SouleMatePlus from './SouleMatePlus';
import SouleMateX from './SouleMateX';
import { colors } from '../utils/theme';
import BackHeader from '../components/BackHeader';

const SubscriptionScreen = () => {
  const route = useRoute();
  const initialTab = route?.params?.tab;
  const [index, setIndex] = useState(initialTab === 'soulemateX' ? 1 : 0);

  const [routes] = useState([
  {key: 'soulemateplus', title: 'SouleMate+'},
  {key: 'soulemateX', title: 'SouleMateX'},
  ]);
  const renderScene = ({route}) => {
    switch (route.key) {
    case 'soulemateplus':
      return <SouleMatePlus />;
    case 'soulemateX':
      return <SouleMateX />;
      default:
        return null;
    }
  };
  return (
    <ScrollView contentContainerStyle={{flexGrow:1}}>
      <SafeAreaView style={{flex: 1, backgroundColor: '#F8F8F8'}}>
  <BackHeader title={index === 1 ? 'SouleMateX' : 'SouleMate+'} />
        <TabView
          navigationState={{index, routes}}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{width: Dimensions.get('window').width}}
          renderTabBar={props => (
            <TabBar
              {...props}
              indicatorStyle={{
                backgroundColor: index === 1 ? colors.white : '#9f4ec2',
              }}
              style={{
                backgroundColor: index === 1 ? '#181818' : '#F8F8F8',
              }}
              labelStyle={{fontWeight: 'bold', fontSize: 16}}
              activeColor={index === 1 ? colors.white : '#9f4ec2'}
              inactiveColor={index === 1 ? '#C0C0C0' : '#202020'}
            />
          )}
        />
      </SafeAreaView>
    </ScrollView>
  );
};

export default SubscriptionScreen;

const styles = StyleSheet.create({});

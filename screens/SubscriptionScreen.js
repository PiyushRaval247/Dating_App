import {StyleSheet, Text, View, ScrollView, SafeAreaView} from 'react-native';
import React, {useState} from 'react';
import { useRoute } from '@react-navigation/native';
import {TabBar, TabView} from 'react-native-tab-view';
import HingePlus from './HingePlus';
import HingeX from './HingeX';
import BackHeader from '../components/BackHeader';

const SubscriptionScreen = () => {
  const route = useRoute();
  const initialTab = route?.params?.tab;
  const [index, setIndex] = useState(initialTab === 'hingeX' ? 1 : 0);

  const [routes] = useState([
    {key: 'hingeplus', title: 'Hinge+'},
    {key: 'hingeX', title: 'HingeX'},
  ]);
  const renderScene = ({route}) => {
    switch (route.key) {
      case 'hingeplus':
        return <HingePlus />;
      case 'hingeX':
        return <HingeX />;
      default:
        return null;
    }
  };
  return (
    <ScrollView contentContainerStyle={{flexGrow:1}}>
      <SafeAreaView style={{flex: 1, backgroundColor: '#F8F8F8'}}>
        <BackHeader title={index === 1 ? 'HingeX' : 'Hinge+'} />
        <TabView
          navigationState={{index, routes}}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{width: '100%'}}
          renderTabBar={props => (
            <TabBar
              {...props}
              indicatorStyle={{
                backgroundColor: index === 1 ? 'white' : '#9f4ec2',
              }}
              style={{
                backgroundColor: index === 1 ? '#181818' : '#F8F8F8',
              }}
              labelStyle={{fontWeight: 'bold', fontSize: 16}}
              activeColor={index === 1 ? 'white' : '#9f4ec2'}
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

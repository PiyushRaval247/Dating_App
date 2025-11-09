import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { PermissionsAndroid } from 'react-native';
import React, {useEffect, useState} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import MapView, {Marker} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import {useNavigation} from '@react-navigation/native';
import { saveRegistrationProgress } from '../utils/registrationUtils';
import NextButton from '../components/NextButton';

const LocationScreen = () => {
  const [region, setRegion] = useState(null);
  const navigation = useNavigation();
  const [location, setLocation] = useState('Loading...');

  useEffect(() => {
    const initLocation = async () => {
      try {
        if (Platform.OS === 'android') {
          setLocation('Awaiting permission…');
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            setLocation('Location permission denied');
            return;
          }
        } else {
          // iOS runtime authorization
          try {
            Geolocation.requestAuthorization('whenInUse');
          } catch (e) {
            // noop
          }
        }

        setLocation('Detecting location…');
        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;

            const initialRegion = {
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };

            setRegion(initialRegion);
            setLocation('Resolving address…');
            fetchAddress(latitude, longitude);
          },
          error => {
            console.log('Error fetching location:', error);
            setLocation('Unable to fetch location');
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 },
        );
      } catch (err) {
        console.log('Location init error:', err);
        setLocation('Unable to initialize location');
      }
    };

    initLocation();
  }, []);
  const fetchAddress = (latitude, longitude) => {
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyAhmKiusQJL88ppfToYqsJ_fywCDrUErMA`,
    )
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data.results) && data.results.length > 0) {
          const addressComponents = data?.results[0].address_components;
          let formattedAddress = '';
          for (let component of addressComponents) {
            if (component.types.includes('sublocality_level_1')) {
              formattedAddress += component.long_name + ', ';
            }
            if (component.types.includes('locality')) {
              formattedAddress += component.long_name + ', ';
            }
          }
          formattedAddress = formattedAddress.trim().replace(/,\s*$/, '');
          setLocation(formattedAddress || data?.results?.[0]?.formatted_address || '');
        } else {
          console.log('Geocode response error:', data?.status);
          setLocation('Address not available');
        }
      })
      .catch(error => {
        console.log('Error fetching address:', error);
        setLocation('Address lookup failed');
      });
  };

  const handleNext = () => {
    saveRegistrationProgress('Location',{location});
    navigation.navigate('Gender');
  };
  console.log('Location', location);
  return (
    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
        backgroundColor: 'white',
      }}>
      <ScrollView contentContainerStyle={{marginTop: 80, marginHorizontal: 20, paddingBottom: 120}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: 'black',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <MaterialDesignIcons name="map-marker" size={23} color="black" />
          </View>
          <Image
            style={{width: 100, height: 40}}
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/128/10613/10613685.png',
            }}
          />
        </View>

        <Text
          style={{
            fontSize: 25,
            fontWeight: 'bold',
            fontFamily: 'GeezaPro-Bold',
            marginTop: 15,
          }}>
          Where do you live?
        </Text>
{region ? (
  <MapView
    style={{ width: '100%', height: 500, marginTop: 20, borderRadius: 5 }}
    region={region}
  >
    <Marker
      coordinate={{
        latitude: region.latitude,
        longitude: region.longitude,
      }}
    >
      <View
        style={{
          backgroundColor: 'black',
          padding: 12,
          borderRadius: 30,
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            fontSize: 14,
            fontWeight: '500',
            color: 'white',
          }}
        >
          {location || 'Fetching location...'}
        </Text>
      </View>
    </Marker>
  </MapView>
) : (
  <MapView
    style={{ width: '100%', height: 500, marginTop: 20, borderRadius: 5 }}
    initialRegion={{
      latitude: 20.5937,
      longitude: 78.9629,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    }}
  />
)}


        {/* Floating Next button pinned bottom-right above the map */}
        <NextButton onPress={handleNext} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default LocationScreen;

const styles = StyleSheet.create({});

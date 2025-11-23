import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  Pressable,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import React, {useEffect, useRef} from 'react';
import LottieView from 'lottie-react-native';
import {useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { colors } from '../utils/theme';
const BasicInfo = () => {
  const navigation = useNavigation();
  const screenWidth = Dimensions.get('window').width;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  // Subtle entrance animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(14)).current;
  const lottieOpacity = useRef(new Animated.Value(0)).current;
  const lottieScale = useRef(new Animated.Value(0.96)).current;
  // Heart halo animation (restored)
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.7)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;
  // Romantic quote + CTA pulse
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const quoteTranslateY = useRef(new Animated.Value(8)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  // Floating heart particles
  const PARTICLE_COUNT = 8;
  const particles = useRef(
    Array.from({length: PARTICLE_COUNT}).map(() => ({
      progress: new Animated.Value(0),
      startX: Math.random() * (screenWidth - 60) + 30,
      size: Math.round(Math.random() * 6) + 10,
      duration: Math.round(Math.random() * 900) + 1400,
      delay: Math.round(Math.random() * 1200),
      drift: Math.random() < 0.5 ? -18 : 18,
    }))
  ).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(lottieOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(lottieScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.elastic(1.2)),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(quoteOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(quoteTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);
  }, [titleOpacity, titleTranslateY, lottieOpacity, lottieScale, quoteOpacity, quoteTranslateY]);

  useEffect(() => {
    const ringLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.25,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.7,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const heartLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heartPulse, {
          toValue: 1.06,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heartPulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    ringLoop.start();
    heartLoop.start();
    return () => {
      ringLoop.stop();
      heartLoop.stop();
    };
  }, [ringScale, ringOpacity, heartPulse]);

  useEffect(() => {
    // CTA subtle pulse to invite interaction
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.04,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [buttonPulse]);

  useEffect(() => {
    // launch floating hearts
    particles.forEach(p => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(p.progress, {
            toValue: 1,
            duration: p.duration,
            delay: p.delay,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(p.progress, {
            toValue: 0,
            duration: p.duration,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
    return () => {
      particles.forEach(p => p.progress.stopAnimation());
    };
  }, [particles]);
  return (
    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
        backgroundColor: colors.card,
      }}>
      {/* Soft tint backdrop at top */}
      <View
        style={{
          position: 'absolute',
          top: -80,
          alignSelf: 'center',
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: '#900C3F10',
        }}
      />
      {/* Header heart accent */}
      <View style={{marginTop: 16, justifyContent: 'center', alignItems: 'center'}}>
        <View style={{position: 'relative'}}>
          <Animated.View
            style={{
              position: 'absolute',
              width: 72,
              height: 72,
              borderRadius: 36,
              borderWidth: 2,
              borderColor: 'rgba(144, 12, 63, 0.33)',
              transform: [{scale: ringScale}],
              opacity: ringOpacity,
            }}
          />
          <Animated.View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: 'rgba(144, 12, 63, 0.09)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{scale: heartPulse}],
            }}
          >
            <Ionicons name="heart" size={30} color="#900C3F" />
          </Animated.View>
        </View>
      </View>

      {/* Brand title + tagline (same as Login) */}
      <View style={{alignItems: 'center', marginTop: 8}}>
        <Text style={{fontSize: 24, fontWeight: '700', color: '#111'}}>SouleMate</Text>
        <Text style={{marginTop: 4, fontSize: 13, color: '#606'}}>Find meaningful connections</Text>
      </View>

      <View style={{marginTop: 16}}>
        <Animated.Text
          style={{
            fontSize: 32,
            fontWeight: 'bold',
  fontWeight: '700',
            marginLeft: 20,
            opacity: titleOpacity,
            transform: [{translateY: titleTranslateY}],
          }}>
          You're one of a kind.
        </Animated.Text>

        <Animated.Text
          style={{
            fontSize: 32,
            fontWeight: 'bold',
  fontWeight: '700',
            marginLeft: 20,
            marginTop: 10,
            opacity: titleOpacity,
           transform: [{translateY: titleTranslateY}],
          }}>
           Your profile should be too.
         </Animated.Text>

        {/* Romantic microcopy */}
        <Animated.Text
          style={{
            marginLeft: 20,
            marginTop: 12,
            fontSize: 16,
            fontStyle: 'italic',
            color: '#7A2C4A',
            opacity: quoteOpacity,
            transform: [{translateY: quoteTranslateY}],
          }}>
          Set the tone — let your story bloom.
        </Animated.Text>
      </View>

      <Animated.View style={{opacity: lottieOpacity, transform: [{scale: lottieScale}]}}>
        <LottieView
          style={{
            height: 240,
            width: 300,
            alignSelf: 'center',
            marginTop: 12,
            justifyContent: 'center',
          }}
          source={require('../assets/love.json')}
          autoPlay
          loop={true}
          speed={0.7}
        />
      </Animated.View>

      {/* Gentle rose accent above CTA */}
      <LottieView
        style={{
          width: 90,
          height: 90,
          alignSelf: 'center',
          marginTop: 8,
          marginBottom: 4,
        }}
        source={require('../assets/rose.json')}
        autoPlay
        loop
        speed={0.8}
      />

      <AnimatedPressable
        onPress={() => navigation.navigate('Name')}
        android_ripple={{color: '#ffffff30'}}
        style={{
          marginTop: 'auto',
          alignSelf: 'center',
          width: '88%',
          marginBottom: 16,
          backgroundColor: '#900C3F',
          height: 52,
          borderRadius: 26,
          alignItems: 'center',
          justifyContent: 'center',
          // iOS shadow
          shadowColor: '#900C3F',
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: {width: 0, height: 4},
          // Android elevation
          elevation: 3,
          transform: [{scale: buttonPulse}],
        }}>
        <Text
          style={{
            textAlign: 'center',
            color: colors.white,
            fontWeight: '600',
            fontSize: 15,
          }}>
          Enter Basic Info
        </Text>
      </AnimatedPressable>

      {/* Floating heart particle overlay */}
      <View
        pointerEvents="none"
        style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0}}
      >
        {particles.map((p, i) => {
          const translateY = p.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -220],
          });
          const translateX = p.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, p.drift],
          });
          const opacity = p.progress.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 0.85, 0.85, 0],
          });
          const scale = p.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1.2],
          });
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                bottom: 110,
                left: p.startX,
                transform: [{translateY}, {translateX}, {scale}],
                opacity,
              }}
            >
              <Ionicons
                name="heart"
                size={p.size}
                color={i % 2 === 0 ? '#C2185B' : '#E91E63'}
              />
            </Animated.View>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

export default BasicInfo;

const styles = StyleSheet.create({});

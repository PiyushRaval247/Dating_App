import React, {useRef, useState} from 'react';
import {View, Image, FlatList, Dimensions} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const ImageCarousel = ({images = [], height = 400, borderRadius = 10, onIndexChange}) => {
  const data = Array.isArray(images)
    ? images.filter(url => typeof url === 'string' && url.trim() !== '')
    : [];
  const [index, setIndex] = useState(0);
  const onViewRef = useRef(({viewableItems}) => {
    if (viewableItems && viewableItems.length > 0) {
      const i = viewableItems[0].index ?? 0;
      setIndex(i);
      if (typeof onIndexChange === 'function') {
        try {
          onIndexChange(i);
        } catch (e) {}
      }
    }
  });
  const viewConfigRef = useRef({viewAreaCoveragePercentThreshold: 50});

  return (
    <View style={{position: 'relative'}}>
      <FlatList
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, i) => `${i}`}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        renderItem={({item}) => (
          <Image
            source={{uri: item}}
            style={{
              width: SCREEN_WIDTH - 24, // account for margins if needed
              height,
              borderRadius,
              resizeMode: 'cover',
            }}
          />
        )}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 10,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
        }}>
        {data.map((_, i) => (
          <View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === index ? '#800080' : '#D0D0D0',
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default ImageCarousel;
// src/features/memory/components/MediaViewer.jsx
import React, {useEffect, useMemo, useRef} from 'react';
import {
  Modal,
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Video from 'react-native-video';
import {getResponsiveHeight, getResponsiveWidth} from '../../../utils/responsive';

const {width: W, height: H} = Dimensions.get('window');

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export default function MediaViewer({
  visible,
  media = [], // [{uri,type}]
  index = 0,
  onIndexChange,
  onClose,
}) {
  const listRef = useRef(null);

  const safeIndex = useMemo(() => {
    if (!media.length) return 0;
    return clamp(index, 0, media.length - 1);
  }, [index, media.length]);

  useEffect(() => {
    if (!visible) return;
    requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToOffset({
          offset: safeIndex * W,
          animated: false,
        });
      } catch {null;}
    });
  }, [visible, safeIndex]);

  const renderItem = ({item, index: idx}) => {
    const isVideo = String(item?.type) === 'video';
    const uri = item?.uri;

    return (
      <View style={styles.page}>
        {isVideo ? (
          <Video
            source={{uri}}
            style={styles.video}
            resizeMode="contain"
            controls
            paused={safeIndex !== idx}
            onError={e => console.log('❌ MediaViewer video error:', uri, e)}
          />
        ) : (
          <FastImage
            pointerEvents="none"
            source={{
              uri,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.contain}
            onError={e => console.log('❌ MediaViewer image error:', uri, e?.nativeEvent)}
          />
        )}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay} />

      <TouchableOpacity style={styles.closeBtn} activeOpacity={0.8} onPress={onClose}>
        <FastImage
          pointerEvents="none"
          source={require('../../../assets/images/clearBt1.png')}
          style={styles.closeIcon}
          resizeMode={FastImage.resizeMode.contain}
        />
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={media}
        keyExtractor={(it, i) => `${it?.uri}_${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({length: W, offset: W * i, index: i})}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          const next = clamp(idx, 0, media.length - 1);
          onIndexChange?.(next);
        }}
        renderItem={renderItem}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  page: {
    width: W,
    height: H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: W,
    height: H,
  },
  video: {
    width: W,
    height: H ,
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? getResponsiveHeight(50) : getResponsiveHeight(20),
    right: getResponsiveWidth(15),
    zIndex: 10,
  },
  closeIcon: {
    width: getResponsiveWidth(22.5),
    height: getResponsiveHeight(22.5),
  },
});

import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, * as Reanimated from 'react-native-reanimated';
import {GestureDetector} from 'react-native-gesture-handler';

import AppText from 'components/AppText';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';

const GAP = getResponsiveWidth(2);
const PADDING_H = getResponsiveWidth(2);

export default function ChatMediaGallery({
  showGallery,
  pinchGesture,
  photos,
  gridColumns,
  renderPhoto,
  galleryHeight,
  onPickFromSystemGallery,
  isPlusDisabled,
  onEndReached,
  onRefresh,
  isRefreshing,
  isLoadingMore,
}) {
  if (!Array.isArray(photos) || photos.length === 0) {
    // photos가 없는데 갤러리 UI를 띄우면 깜빡일 수 있어서
    if (!showGallery) return null;
  }

  return (
    <Animated.View
      key={showGallery ? 'open' : 'close'}
      entering={showGallery ? Reanimated.FadeInDown.duration(150) : undefined}
      exiting={Reanimated.FadeOutDown.duration(80)}
      style={[
        styles.galleryContainer,
        {
          height: showGallery ? galleryHeight : 0,
        },
      ]}>
      {showGallery && (
        <GestureDetector gesture={pinchGesture}>
          <View style={{flex: 1}}>
            <View style={styles.galleryFloatingArea} pointerEvents="box-none">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPickFromSystemGallery}
                style={styles.galleryFloatingButton}
                disabled={isPlusDisabled}>
                <Image
                  source={require('../../../assets/icons/tabs/2/camera.png')}
                  width={20}
                  height={20}
                  style={{
                    width: getResponsiveIconSize(20),
                    height: getResponsiveIconSize(20),
                    resizeMode: 'contain',
                  }}
                  tintColor={'#ffffff'}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={photos}
              key={`chat-gallery-${gridColumns}`}
              keyExtractor={(item, index) => item.uri + index}
              renderItem={renderPhoto}
              numColumns={gridColumns}
              contentContainerStyle={styles.galleryContent}
              columnWrapperStyle={styles.columnWrapper}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.2}
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              scrollEventThrottle={16}
              ListFooterComponent={
                isLoadingMore ? <AppText style={styles.footer} /> : null
              }
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={false}
            />
          </View>
        </GestureDetector>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  galleryContainer: {
    maxHeight: getResponsiveHeight(300),
    backgroundColor: '#fff',
    alignItems: 'center',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(17,24,39,0.06)',
  },
  galleryFloatingArea: {
    position: 'absolute',
    top: getResponsiveHeight(8),
    right: getResponsiveWidth(10),
    zIndex: 50,
    elevation: 10,
  },
  galleryFloatingButton: {
    backgroundColor: 'rgba(17,24,39,0.72)',
    padding: getResponsiveIconSize(20),
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: getResponsiveIconSize(30),
    height: getResponsiveIconSize(30),
    borderColor: 'rgba(255,255,255,0.18)',
  },
  galleryContent: {
    paddingTop: GAP,
    paddingBottom: GAP,
    paddingHorizontal: PADDING_H,
  },
  columnWrapper: {
    columnGap: GAP,
  },
  footer: {
    textAlign: 'center',
    paddingVertical: getResponsiveHeight(4),
    color: '#666',
    fontSize: getResponsiveFontSize(13),
  },
});


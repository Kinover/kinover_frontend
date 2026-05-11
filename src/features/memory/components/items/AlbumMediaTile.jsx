import React, {memo, useMemo, useCallback} from 'react';
import { View, StyleSheet } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import FastImage from '@d11/react-native-fast-image';

import formatDuration from 'utils/formatDuration';
import {getResponsiveFontSize, getResponsiveWidth} from 'utils/responsive';
import {useColors} from 'hooks/useColors';
import AppText from 'components/AppText';

const ITEM_MARGIN = getResponsiveWidth(2);

const FASTIMAGE_DEFAULTS = {
  priority: FastImage.priority.normal,
  cache: FastImage.cacheControl.immutable,
};

const AlbumMediaTile = memo(function AlbumMediaTile({
  uri,
  isVideo,
  thumbUri,
  duration,
  tileWidth,
  postId,
  indexInPost,
  onOpenPost,
}) {
  const colors = useColors();

  const tileStyle = useMemo(
    () => ({
      width: tileWidth,
      aspectRatio: 1,
      marginBottom: ITEM_MARGIN,
    }),
    [tileWidth],
  );

  const source = useMemo(() => {
    if (isVideo && thumbUri) {
      return {uri: thumbUri, ...FASTIMAGE_DEFAULTS};
    }
    if (!isVideo && uri) {
      return {uri, ...FASTIMAGE_DEFAULTS};
    }
    return null;
  }, [isVideo, thumbUri, uri]);

  const handlePress = useCallback(() => {
    if (postId == null) return;
    onOpenPost(postId, indexInPost);
  }, [postId, indexInPost, onOpenPost]);

  return (
    <SpringPressable activeOpacity={0.85} onPress={handlePress} style={tileStyle}>
      {source ? (
        <FastImage
          fallback={true}
          source={source}
          style={[styles.galleryImage, {backgroundColor: colors.borderSubtle}]}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={[styles.galleryPlaceholder, {backgroundColor: colors.borderSubtle}]} />
      )}

      {isVideo && (
        <>
          <View pointerEvents="none" style={styles.albumPlayOverlay}>
            <View style={styles.albumPlayCircle}>
              <View style={styles.albumPlayTriangle} />
            </View>
          </View>

          {!!duration && (
            <View pointerEvents="none" style={styles.videoBadge}>
              <AppText style={[styles.videoBadgeText, {color: colors.textInverse}]}>
                {formatDuration(duration)}
              </AppText>
            </View>
          )}
        </>
      )}
    </SpringPressable>
  );
});

const styles = StyleSheet.create({
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryPlaceholder: {
    width: '100%',
    height: '100%',
  },
  albumPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumPlayCircle: {
    width: getResponsiveWidth(36),
    height: getResponsiveWidth(36),
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumPlayTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 3,
  },
  videoBadge: {
    position: 'absolute',
    bottom: getResponsiveWidth(4),
    right: getResponsiveWidth(4),
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
  },
  videoBadgeText: {
    fontSize: getResponsiveFontSize(10.5),
  },
});

export default AlbumMediaTile;

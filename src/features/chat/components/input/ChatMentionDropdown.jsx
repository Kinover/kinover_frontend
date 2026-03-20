import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  Platform,
} from 'react-native';

import AppText from 'components/AppText';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

export default function ChatMentionDropdown({
  mentionCandidates,
  mentionBottom,
  onPickMention,
}) {
  if (!Array.isArray(mentionCandidates) || mentionCandidates.length === 0) {
    return null;
  }

  return (
    <View
      style={[styles.mentionDropdown, {bottom: mentionBottom}]}
      pointerEvents="box-none">
      <View style={styles.mentionDropdownBox}>
        <FlatList
          keyboardShouldPersistTaps="always"
          data={mentionCandidates}
          keyExtractor={item => String(item.userId)}
          renderItem={({item}) => (
            <Pressable
              onPress={() => onPickMention?.(item)}
              style={({pressed}) => [
                styles.mentionItem,
                pressed && {opacity: 0.86},
              ]}>
              <Image
                source={
                  item.image
                    ? {uri: item.image}
                    : require('assets/images/default.png')
                }
                style={styles.mentionAvatar}
              />
              <AppText style={styles.mentionName} numberOfLines={1}>
                {item.name}
              </AppText>
              <AppText style={styles.mentionHint}>@{item.name}</AppText>
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mentionDropdown: {
    position: 'absolute',
    left: getResponsiveWidth(14),
    right: getResponsiveWidth(14),
    zIndex: 999,
    elevation: 20,
  },
  mentionDropdownBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.10)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.2,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(10),
  },
  mentionAvatar: {
    width: getResponsiveWidth(28),
    height: getResponsiveWidth(28),
    borderRadius: 999,
    backgroundColor: 'rgba(255,200,77,0.15)',
  },
  mentionName: {
    flex: 1,
    minWidth: 0,
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13.5),
  },
  mentionHint: {
    color: '#6B7280',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12),
  },
});


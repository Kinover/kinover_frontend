// src/components/MentionInput.jsx
import React, {useMemo, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';

import {
  findActiveMentionQuery,
  applyMention,
  extractMentionUserIds,
} from 'utils/mentions';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

export default function MentionInput({
  value,
  onChangeText,

  users = [],

  myUserId,

 // 전송 버튼 누를 때: {text, mentionUserIds} 형태로 반환
  onSubmit,

  placeholder = '댓글을 입력하세요',

  inputStyle,
  containerStyle,

  disabled = false,

  showSubmitButton = true,
  submitLabel = '전송',
}) {
  const inputRef = useRef(null);
  const [cursor, setCursor] = useState(0);
  const [inputH, setInputH] = useState(getResponsiveHeight(44));

  const active = useMemo(
    () => findActiveMentionQuery(value || '', cursor),
    [value, cursor],
  );

 // 멘션 후보 목록: 본인 제외
  const filtered = useMemo(() => {
    if (!active) return [];

    const q = (active.query || '').toLowerCase();
    const me = myUserId == null ? null : String(myUserId);

    const list = (users || [])
      .filter(u => !!u?.name && u?.userId != null)
      .filter(u => (me ? String(u.userId) !== me : true));

    if (!q) return list.slice(0, 6);
    return list
      .filter(u => String(u.name).toLowerCase().includes(q))
      .slice(0, 6);
  }, [active, users, myUserId]);

  const onSelectionChange = useCallback(e => {
    const next = e?.nativeEvent?.selection?.start ?? 0;
    setCursor(next);
  }, []);

  const handlePick = useCallback(
    user => {
      if (!active) return;

      const {next, nextCursor} = applyMention(
        value || '',
        active.atIndex,
        cursor,
        user.name,
      );

      onChangeText(next);

      requestAnimationFrame(() => {
        inputRef.current?.focus?.();
        inputRef.current?.setNativeProps?.({
          selection: {start: nextCursor, end: nextCursor},
        });
        setCursor(nextCursor);
      });
    },
    [active, cursor, onChangeText, value],
  );

  const handleSubmit = useCallback(() => {
    const text = (value || '').trim();
    if (!text) return;

 // 혹시 몰라서 여기서도 본인 제거(백업)
    const me = myUserId == null ? null : String(myUserId);
    const mentionUserIds = extractMentionUserIds(text, users).filter(id =>
      me ? String(id) !== me : true,
    );

    onSubmit?.({text, mentionUserIds});
  }, [onSubmit, users, value, myUserId]);

  return (
    <View style={[styles.wrap, containerStyle]}>
      <View
        style={styles.row}
        onLayout={e => {
          const h = e?.nativeEvent?.layout?.height ?? inputH;
          setInputH(h);
        }}>
        {/* 입력창 자체에서 멘션만 스타일 바꾸는 건 TextInput 단독으론 불가능
            (부분 스타일링 X). 아래 "해결 옵션" 참고! */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(17,24,39,0.35)"
          style={[styles.input, inputStyle]}
          editable={!disabled}
          multiline
          onSelectionChange={onSelectionChange}
        />

        {showSubmitButton && (
          <Pressable
            disabled={disabled}
            onPress={handleSubmit}
            style={({pressed}) => [
              styles.submit,
              pressed && {opacity: 0.85},
              disabled && {opacity: 0.5},
            ]}>
            <Text allowFontScaling={false} style={styles.submitText}>{submitLabel}</Text>
          </Pressable>
        )}
      </View>

      {/* 멘션 추천 드롭다운 */}
      {!!active && filtered.length > 0 && (
        <View
          style={[styles.dropdown, {bottom: inputH + getResponsiveHeight(6)}]}
          pointerEvents="box-none">
          <View style={styles.dropdownBox}>
            <FlatList
              keyboardShouldPersistTaps="always"
              data={filtered}
              keyExtractor={item => String(item.userId)}
              renderItem={({item}) => (
                <Pressable
                  onPress={() => handlePick(item)}
                  style={({pressed}) => [styles.item, pressed && {opacity: 0.85}]}>
                  <Image
                    source={
                      item.image
                        ? {uri: item.image}
                        : require('@/assets/images/default.png')
                    }
                    style={styles.avatar}
                  />
                  <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text allowFontScaling={false} style={styles.hint}>@{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: getResponsiveWidth(8),
  },
  input: {
    flex: 1,
    minHeight: getResponsiveHeight(44),
    maxHeight: getResponsiveHeight(120),
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.12)',
    backgroundColor: '#fff',
    color: '#111827',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13.5),
    lineHeight: getResponsiveHeight(20),
  },
  submit: {
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 12,
    backgroundColor: '#FFC84D',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: getResponsiveHeight(44),
  },
  submitText: {
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13.5),
  },

  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 20,
  },
  dropdownBox: {
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(10),
  },
  avatar: {
    width: getResponsiveWidth(28),
    height: getResponsiveWidth(28),
    borderRadius: 999,
    backgroundColor: 'rgba(255,200,77,0.15)',
  },
  name: {
    flex: 1,
    minWidth: 0,
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13.5),
  },
  hint: {
    color: '#6B7280',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12),
  },
});

import React, {useMemo, useState, useEffect, useCallback} from 'react';
import {View, Platform, Pressable, TextInput} from 'react-native';
import CustomModal from 'components/modal/CustomModal';
import ScreenConfetti from './ScreenConfetti';
import {hapticLight} from 'utils/haptic';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {getResponsiveWidth, getResponsiveHeight} from 'utils/responsive';

export default function BirthdayModal({
  visible,
  onClose,
  namesText,
  /** (editedMessage: string, chatRoomId: string) => void */
  onSendMessage,
  sendingMessage = false,
  chatRoomItems = [],
  selectedChatRoomId = null,
  onSelectChatRoom,
  chatRoomLoading = false,
}) {
  const styles = useScaledStyleSheet(rf => ({
    modalBox: {
      width: getResponsiveWidth(326),
      maxWidth: '90%',
      alignSelf: 'center',
      borderRadius: getResponsiveWidth(20),
    },
    contentArea: {
      marginTop: getResponsiveHeight(4),
    },
    content: {
      gap: getResponsiveHeight(16),
    },

    /* ── 메시지 입력창 ─────────────────────── */
    messageInput: {
      borderWidth: 1,
      borderColor: 'rgba(17,24,39,0.10)',
      borderRadius: getResponsiveWidth(14),
      paddingHorizontal: getResponsiveWidth(14),
      paddingTop: getResponsiveHeight(12),
      paddingBottom: getResponsiveHeight(12),
      fontFamily: 'Pretendard-Regular',
      fontSize: rf(13.5),
      color: '#111827',
      lineHeight: getResponsiveHeight(21),
      minHeight: getResponsiveHeight(90),
      textAlignVertical: 'top',
      backgroundColor: '#FAFAFA',
      ...(Platform.OS === 'ios'
        ? {
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: {width: 0, height: 2},
          }
        : {}),
    },
    messageInputFocused: {
      borderColor: '#FFC84D',
      backgroundColor: '#FFFFFF',
    },

    /* ── 채팅방 섹션 ───────────────────────── */
    sectionLabel: {
      fontFamily: 'Pretendard-SemiBold',
      fontSize: rf(12.5),
      color: '#374151',
      marginBottom: getResponsiveHeight(9),
    },
    roomChipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: getResponsiveWidth(8),
    },
    roomChip: {
      borderWidth: 1,
      borderColor: 'rgba(17,24,39,0.12)',
      borderRadius: 999,
      paddingHorizontal: getResponsiveWidth(14),
      paddingVertical: getResponsiveHeight(7),
      backgroundColor: '#FFFFFF',
    },
    roomChipSelected: {
      borderColor: '#FFC84D',
      backgroundColor: '#FFF8E6',
    },
    roomChipText: {
      fontFamily: 'Pretendard-Medium',
      fontSize: rf(12.5),
      color: '#4B5563',
    },
    roomChipTextSelected: {
      fontFamily: 'Pretendard-SemiBold',
      color: '#7A4E00',
    },
    hintText: {
      fontFamily: 'Pretendard-Regular',
      fontSize: rf(11.5),
      color: '#9CA3AF',
      marginTop: getResponsiveHeight(7),
    },
    emptyText: {
      fontFamily: 'Pretendard-Regular',
      fontSize: rf(13),
      color: '#9CA3AF',
      textAlign: 'center',
      paddingVertical: getResponsiveHeight(8),
    },
    confirmDisabled: {
      opacity: 0.38,
    },
  }));

  /* ── 이름 파싱 ──────────────────────────────── */
  const parsed = useMemo(() => {
    const raw = String(namesText || '').trim();
    const cleaned = raw
      .replace(/님의\s*생일.*$/g, '')
      .replace(/\s*생일.*$/g, '')
      .trim();
    const hasEtc = raw.includes('외');
    const names = cleaned
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const first = names[0] || '가족';
    const second = names[1] || null;
    const heroNames = `${first}${second ? ` · ${second}` : ''}${
      hasEtc ? ' 외' : ''
    }`;
    return {heroNames};
  }, [namesText]);

  const defaultMessage = `${parsed.heroNames} 생일 축하해요! 🎉\n오늘 하루, 웃는 일이 더 많았으면 해요.\n늘 고맙고 소중해요.`;

  const [editedMessage, setEditedMessage] = useState(defaultMessage);
  const [inputFocused, setInputFocused] = useState(false);

  /* 모달 열릴 때마다 추천 문구로 초기화 */
  useEffect(() => {
    if (visible) {
      setEditedMessage(defaultMessage);
      setInputFocused(false);
    }
    // defaultMessage는 namesText에 의존 → visible만 deps로 두면 충분
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const canSend =
    selectedChatRoomId != null &&
    editedMessage.trim().length > 0 &&
    !sendingMessage;

  const handleConfirm = useCallback(() => {
    if (!canSend) return;
    onSendMessage?.(editedMessage.trim(), selectedChatRoomId);
  }, [canSend, editedMessage, selectedChatRoomId, onSendMessage]);

  return (
    <CustomModal
      showCloseButton
      visible={visible}
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmText={sendingMessage ? '전송 중...' : '보내기'}
      confirmButtonStyle={!canSend ? styles.confirmDisabled : null}
      title={`${parsed.heroNames} 생일 🎂`}
      subText="오늘 축하 메시지를 보내볼까요?"
      modalBoxStyle={styles.modalBox}
      contentStyle={styles.contentArea}
      overlayChildren={
        <ScreenConfetti visible={visible} originX={0.5} originY={0.52} />
      }>
      <View style={styles.content}>
        {/* ── 편집 가능한 축하 메시지 ──────────── */}
        <TextInput
          allowFontScaling={false}
          style={[
            styles.messageInput,
            inputFocused && styles.messageInputFocused,
          ]}
          value={editedMessage}
          onChangeText={setEditedMessage}
          multiline
          editable={!sendingMessage}
          placeholder="축하 메시지를 입력해주세요"
          placeholderTextColor="#9CA3AF"
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          scrollEnabled={false}
        />

        {/* ── 채팅방 선택 ───────────────────────── */}
        <View>
          <AppText allowFontScaling={false} style={styles.sectionLabel}>
            보낼 채팅방
          </AppText>

          {chatRoomLoading && chatRoomItems.length === 0 ? (
            <AppText allowFontScaling={false} style={styles.emptyText}>
              채팅방 목록을 불러오는 중이에요...
            </AppText>
          ) : chatRoomItems.length === 0 ? (
            <AppText allowFontScaling={false} style={styles.emptyText}>
              보낼 수 있는 채팅방이 없어요.
            </AppText>
          ) : (
            <View style={styles.roomChipWrap}>
              {chatRoomItems.map(room => {
                const selected = selectedChatRoomId === room.id;
                return (
                  <Pressable
                    key={room.id}
                    onPress={() => {
                      hapticLight();
                      onSelectChatRoom?.(room.id);
                    }}
                    disabled={sendingMessage}
                    style={({pressed}) => [
                      styles.roomChip,
                      selected && styles.roomChipSelected,
                      pressed && {opacity: 0.72},
                    ]}>
                    <AppText
                      allowFontScaling={false}
                      style={[
                        styles.roomChipText,
                        selected && styles.roomChipTextSelected,
                      ]}
                      numberOfLines={1}>
                      {room.title}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          )}

          {!selectedChatRoomId && chatRoomItems.length > 0 && (
            <AppText allowFontScaling={false} style={styles.hintText}>
              채팅방을 선택하면 보내기 버튼이 활성화돼요.
            </AppText>
          )}
        </View>
      </View>
    </CustomModal>
  );
}

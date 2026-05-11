import React, {useMemo, useState, useEffect, useCallback} from 'react';
import {View, Platform, Pressable, TextInput} from 'react-native';
import CustomModal from 'components/modal/CustomModal';
import ScreenConfetti from './ScreenConfetti';
import {hapticLight} from 'utils/haptic';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {getResponsiveWidth, getResponsiveHeight} from 'utils/responsive';
import {FONTS} from 'styles/typography';
import {useColors, useIsDark} from 'hooks/useColors';

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
  const colors = useColors();
  const isDark = useIsDark();
  const styles = useScaledStyleSheet(
    rf => ({
    modalBox: {
      width: getResponsiveWidth(326),
      maxWidth: '90%',
      alignSelf: 'center',
      borderRadius: getResponsiveWidth(20),
      overflow: 'hidden',
    },
    contentArea: {
      marginTop: 0,
    },
    header: {
      marginHorizontal: -getResponsiveWidth(19),
      marginTop: -getResponsiveHeight(19),
      paddingTop: getResponsiveHeight(18),
      paddingBottom: getResponsiveHeight(14),
      paddingHorizontal: getResponsiveWidth(18),
      backgroundColor: '#FFC84D',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(17,24,39,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerIconBubble: {
      width: getResponsiveWidth(34),
      height: getResponsiveWidth(34),
      borderRadius: 999,
      backgroundColor: '#FFF8E6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: getResponsiveHeight(7),
    },
    headerIcon: {
      fontSize: rf(19),
    },
    headerTitle: {
      fontFamily: FONTS.SEMI_BOLD,
      fontSize: rf(17),
      color: '#6B3E00',
      textAlign: 'center',
      paddingHorizontal: getResponsiveWidth(38),
    },
    headerSubText: {
      marginTop: getResponsiveHeight(6),
      fontFamily: FONTS.MEDIUM,
      fontSize: rf(12.5),
      color: '#7A4E00',
      textAlign: 'center',
    },
    content: {
      gap: getResponsiveHeight(16),
    },

    /* ── 메시지 입력창 ─────────────────────── */
    messageInput: {
      borderWidth: 1,
      borderColor: isDark ? colors.borderSubtle : '#F5F5F5',
      borderRadius: getResponsiveWidth(14),
      paddingHorizontal: getResponsiveWidth(14),
      paddingTop: getResponsiveHeight(10),
      paddingBottom: getResponsiveHeight(10),
      fontFamily: FONTS.REGULAR,
      fontSize: rf(13.5),
      color: isDark ? colors.textPrimary : '#111827',
      lineHeight: getResponsiveHeight(21),
      minHeight: getResponsiveHeight(90),
      textAlignVertical: 'top',
      backgroundColor: isDark ? colors.surfaceMuted : '#F5F5F5',
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
      borderWidth: 2,
    },
    messageHelperText: {
      marginTop: -getResponsiveHeight(2),
      marginBottom: getResponsiveHeight(2),
      fontFamily: FONTS.REGULAR,
      fontSize: rf(11.5),
      color: '#7A7A7A',
    },

    /* ── 채팅방 섹션 ───────────────────────── */
    sectionLabel: {
      fontFamily: FONTS.SEMI_BOLD,
      fontSize: rf(12.5),
      color: '#374151',
      marginBottom: getResponsiveHeight(9),
    },
    messageSectionLabel: {
      marginBottom: getResponsiveHeight(2),
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
      fontFamily: FONTS.MEDIUM,
      fontSize: rf(12.5),
      color: '#4B5563',
    },
    roomChipTextSelected: {
      fontFamily: FONTS.SEMI_BOLD,
      color: '#7A4E00',
    },
    hintText: {
      fontFamily: FONTS.REGULAR,
      fontSize: rf(11.5),
      color: '#9CA3AF',
      marginTop: getResponsiveHeight(7),
    },
    emptyText: {
      fontFamily: FONTS.REGULAR,
      fontSize: rf(13),
      color: '#9CA3AF',
      textAlign: 'center',
      paddingVertical: getResponsiveHeight(8),
    },
    confirmDisabled: {
      opacity: 0.38,
    },
  }),
    [colors, isDark],
  );

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
  }, [visible, defaultMessage]);

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
      showCloseButton={false}
      visible={visible}
      onClose={onClose}
      onConfirm={handleConfirm}
      closeText="닫기"
      confirmText={sendingMessage ? '전송 중...' : '보내기'}
      confirmButtonStyle={!canSend ? styles.confirmDisabled : null}
      title={null}
      subText={null}
      modalBoxStyle={styles.modalBox}
      contentStyle={styles.contentArea}
      overlayChildren={
        <ScreenConfetti visible={visible} originX={0.5} originY={0.52} />
      }>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerIconBubble}>
            <AppText allowFontScaling={false} style={styles.headerIcon}>
              🎂
            </AppText>
          </View>
          <AppText allowFontScaling={false} style={styles.headerTitle}>
            {`${parsed.heroNames} 생일`}
          </AppText>
          <AppText allowFontScaling={false} style={styles.headerSubText}>
            오늘 축하 메시지를 보내볼까요?
          </AppText>
        </View>

        {/* ── 편집 가능한 축하 메시지 ──────────── */}
        <AppText
          allowFontScaling={false}
          style={[styles.sectionLabel, styles.messageSectionLabel]}>
          축하 메시지
        </AppText>
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
          placeholderTextColor={
            isDark ? colors.textTertiary : '#9CA3AF'
          }
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          scrollEnabled={false}
        />
        <AppText allowFontScaling={false} style={styles.messageHelperText}>
          문구를 눌러 원하는 내용으로 자유롭게 수정할 수 있어요.
        </AppText>

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

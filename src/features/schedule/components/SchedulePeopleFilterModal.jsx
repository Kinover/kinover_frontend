import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';

import AppText from 'components/AppText';
import CustomModal from 'components/modal/CustomModal';
import {getResponsiveHeight, getResponsiveWidth} from 'utils/responsive';
import {COLORS} from 'styles/style';
import {hapticLight} from 'utils/haptic';

function uniqStrings(ids) {
  const seen = new Set();
  const out = [];
  (ids || []).forEach(x => {
    const s = String(x);
    if (!s || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  });
  return out;
}

export default function SchedulePeopleFilterModal({
  visible,
  onClose,
  onApply,
  familyUserList = [],
  currentUserId,
  selectedUserIds = [],
}) {
  const [draft, setDraft] = useState([]);

  useEffect(() => {
    if (visible) {
      setDraft(uniqStrings(selectedUserIds));
    }
  }, [visible, selectedUserIds]);

  const members = useMemo(() => {
    const rows = [];
    (familyUserList || []).forEach(u => {
      const id = u?.userId ?? u?.id;
      if (id == null) return;
      rows.push({
        id: String(id),
        label: String(u?.nickname ?? u?.name ?? '가족').trim() || '가족',
      });
    });
    return rows;
  }, [familyUserList]);

  const toggleId = useCallback(id => {
    const sid = String(id);
    setDraft(prev => {
      if (prev.includes(sid)) return prev.filter(x => x !== sid);
      return [...prev, sid];
    });
  }, []);

  const handleApply = useCallback(() => {
    hapticLight();
    onApply?.(uniqStrings(draft));
    onClose?.();
  }, [draft, onApply, onClose]);

  const handleClear = useCallback(() => {
    hapticLight();
    setDraft([]);
  }, []);

  const handleSelectOnlyMe = useCallback(() => {
    if (currentUserId == null || String(currentUserId).trim() === '') return;
    hapticLight();
    setDraft([String(currentUserId)]);
  }, [currentUserId]);

  const meId =
    currentUserId != null && String(currentUserId).trim() !== ''
      ? String(currentUserId)
      : null;
  const isAllView = draft.length === 0;
  const isOnlyMe =
    meId != null &&
    draft.length === 1 &&
    draft[0] === meId;

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={handleApply}
      onRequestClose={onClose}
      title="누구 일정을 볼까요?"
      closeText="취소"
      confirmText="적용"
      closeOnBackdropPress
      contentStyle={styles.content}
      modalWrapperStyle={styles.modalWrapper}
      modalBoxStyle={styles.modalBox}>
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={[styles.quickBtn, isAllView && styles.quickBtnActive]}
          onPress={handleClear}
          activeOpacity={0.88}>
          <AppText
            allowFontScaling={false}
            style={[styles.quickBtnText, isAllView && styles.quickBtnTextActive]}>
            전체 보기
          </AppText>
        </TouchableOpacity>
        {meId != null && (
          <TouchableOpacity
            style={[styles.quickBtn, isOnlyMe && styles.quickBtnActive]}
            onPress={handleSelectOnlyMe}
            activeOpacity={0.88}>
            <AppText
              allowFontScaling={false}
              style={[styles.quickBtnText, isOnlyMe && styles.quickBtnTextActive]}>
              나만
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {members.length === 0 ? (
          <AppText allowFontScaling={false} style={styles.empty}>
            가족 목록을 불러오지 못했어요.
          </AppText>
        ) : (
          members.map(m => {
            const on = draft.includes(m.id);
            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.88}
                style={[styles.row, on && styles.rowOn]}
                onPress={() => {
                  hapticLight();
                  toggleId(m.id);
                }}>
                <View style={[styles.checkbox, on && styles.checkboxOn]}>
                  {on ? (
                    <AppText allowFontScaling={false} style={styles.checkMark}>
                      ✓
                    </AppText>
                  ) : null}
                </View>
                <AppText
                  allowFontScaling={false}
                  style={[styles.rowLabel, on && styles.rowLabelOn]}
                  numberOfLines={1}>
                  {m.label}
                </AppText>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </CustomModal>
  );
}

const SCREEN_W = Dimensions.get('window').width;

const styles = StyleSheet.create({
  modalWrapper: {
    width: '100%',
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: Math.min(getResponsiveWidth(332), SCREEN_W * 0.92),
    maxWidth: '92%',
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: 0,
    minHeight: getResponsiveHeight(120),
    maxHeight: getResponsiveHeight(340),
  },
  quickRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(8),
    marginBottom: getResponsiveHeight(10),
  },
  quickBtn: {
    paddingVertical: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: COLORS.surfaceMuted,
  },
  quickBtnActive: {
    borderColor: COLORS.brandPrimary,
    backgroundColor: COLORS.brandPrimarySoft,
  },
  quickBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12.5,
    color: COLORS.textSecondary,
  },
  quickBtnTextActive: {
    color: COLORS.textPrimary,
  },
  list: {
    maxHeight: getResponsiveHeight(260),
  },
  listContent: {
    gap: getResponsiveHeight(8),
    paddingBottom: getResponsiveHeight(4),
  },
  empty: {
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingVertical: getResponsiveHeight(16),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(11),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.08)',
    backgroundColor: COLORS.surfacePrimary,
  },
  rowOn: {
    borderColor: COLORS.brandPrimary,
    backgroundColor: COLORS.brandPrimarySoft,
  },
  checkbox: {
    width: getResponsiveWidth(22),
    height: getResponsiveWidth(22),
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(17, 24, 39, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfacePrimary,
  },
  checkboxOn: {
    borderColor: COLORS.brandPrimaryStrong,
    backgroundColor: COLORS.brandPrimarySoft,
  },
  checkMark: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontFamily: 'Pretendard-Bold',
    marginTop: -1,
  },
  rowLabel: {
    flex: 1,
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  rowLabelOn: {
    fontFamily: 'Pretendard-SemiBold',
  },
});

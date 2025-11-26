/* eslint-disable react-native/no-inline-styles */
import React, {forwardRef, useImperativeHandle, useState} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {BottomSheetTextInput, BottomSheetView} from '@gorhom/bottom-sheet';
import LinearGradient from 'react-native-linear-gradient';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {useScheduleBottomSheetModal} from '../hooks/useScheduleBottomSheetModal';
import {useIsAllSelected} from '../hooks/useIsAllSelected';
import {BottomSheetButtons} from 'components/BottomSheetButtons';
import {KinoBottomSheet} from 'components/KinoBottomSheetModal';
import ToastModal from '../../../components/ToastModal';

const ScheduleEditorBottomSheetModal = forwardRef(
  (
    {
      editingSchedule,
      familyUserList = [],
      selectedUserId,
      setSelectedUserId,
      title,
      setTitle,
      onSubmit,
      onDelete,
      onRefresh,
    },
    ref,
  ) => {
    const {
      modalRef,
      snapPoints,
      scheduleRef,
      inputKey,
      handleSave,
      handleDelete,
    } = useScheduleBottomSheetModal({
      editingSchedule,
      title,
      setTitle,
      onSubmit,
      onDelete,
      onRefresh,
    });

    const isSelectedAll = useIsAllSelected(selectedUserId);

    const [scrollContainerWidth, setScrollContainerWidth] = useState(0);
    const [canScroll, setCanScroll] = useState(false);

    // ✅ 토스트 상태
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const showToast = msg => {
      setToastMessage(msg);
      setToastVisible(true);
    };

    const hideToast = () => {
      setToastVisible(false);
    };

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }));

    const handlePressSave = () => {
      const text = scheduleRef.current || '';
      if (!text.trim()) {
        showToast('일정 내용을 입력해주세요.');
        return;
      }
      handleSave();
    };

    return (
      <>
        <KinoBottomSheet
          modalRef={modalRef}
          snapPoints={snapPoints}
          enableContentPanningGesture={false}
          keyboardBehavior="extend">
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              modalRef.current?.snapToIndex(0);
            }}>
            <BottomSheetView style={styles.container}>
              {/* 제목 영역 */}
              <View style={styles.titleRow}>
                <View>
                  <Text style={styles.sheetTitle}>
                    {editingSchedule ? '일정 수정' : '일정 추가'}
                  </Text>
                  <Text style={styles.sheetSubtitle}>
                    {editingSchedule
                      ? '가족과 일정을 공유해요'
                      : '가족과 일정을 공유해요'}
                  </Text>
                </View>
              </View>

              {/* 가족 선택 섹션 */}
              <Text style={styles.subTitle}>구성원 선택</Text>
              <View
                style={styles.userScrollWrapper}
                onLayout={e =>
                  setScrollContainerWidth(e.nativeEvent.layout.width)
                }>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                  contentContainerStyle={{
                    paddingVertical: getResponsiveHeight(6),
                  }}
                  style={styles.userScroll}
                  onContentSizeChange={(contentWidth, _h) => {
                    setCanScroll(contentWidth > scrollContainerWidth + 8);
                  }}>
                  {/* ALL 버튼 */}
                  <View style={styles.avatarColumn}>
                    <TouchableOpacity
                      style={[
                        styles.avatarBtn,
                        isSelectedAll && styles.avatarBtnSelected,
                      ]}
                      onPress={() => setSelectedUserId('')}>
                      <Text
                        style={[
                          styles.allText,
                          isSelectedAll && styles.allTextSelected,
                        ]}>
                        ALL
                      </Text>
                      {isSelectedAll && (
                        <Image
                          source={require('../../../assets/icons/check-yellow.png')}
                          style={styles.checkBadge}
                        />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.avatarLabel}>전체</Text>
                  </View>

                  {/* 가족 리스트 */}
                  {familyUserList.map(user => {
                    const isSel = selectedUserId === user.userId;
                    return (
                      <View key={user.userId} style={styles.avatarColumn}>
                        <TouchableOpacity
                          style={[
                            styles.avatarBtn,
                            isSel && styles.avatarBtnSelected,
                          ]}
                          onPress={() => setSelectedUserId(user.userId)}>
                          <Image
                            source={{uri: user.image}}
                            style={[
                              styles.avatarImage,
                              isSel && styles.avatarImageSelected,
                            ]}
                          />
                          {isSel && (
                            <Image
                              source={require('../../../assets/icons/check-yellow.png')}
                              style={styles.checkBadge}
                            />
                          )}
                        </TouchableOpacity>
                        <Text style={styles.avatarLabel} numberOfLines={1}>
                          {user.name}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* 오른쪽 끝 페이드 */}
                {canScroll && (
                  <LinearGradient
                    pointerEvents="none"
                    colors={[
                      'rgba(255,255,255,0)',
                      'rgba(255,255,255,0.4)',
                      'rgba(255,255,255,0.9)',
                    ]}
                    locations={[0, 0.4, 1]}
                    start={{x: 0, y: 0.5}}
                    end={{x: 1, y: 0.5}}
                    style={styles.rightFade}
                  />
                )}
              </View>

              {/* 일정 내용 입력 */}
              <Text style={styles.subTitle}>일정 내용</Text>
              <BottomSheetTextInput
                key={`input-${inputKey}`}
                defaultValue={scheduleRef.current}
                onChangeText={text => (scheduleRef.current = text)}
                onFocus={() =>
                  setTimeout(() => modalRef.current?.snapToIndex(1), 50)
                }
                placeholder="예) 병원 예약, 가족 모임"
                placeholderTextColor="#B0B0B0"
                style={styles.input}
                autoCorrect={false}
                autoCapitalize="none"
                multiline
                autoComplete="off"
                spellCheck={false}
                importantForAutofill="no"
              />

              {/* 하단 버튼 공통 컴포넌트 */}
              {editingSchedule ? (
                <BottomSheetButtons
                  onCancel={handleDelete}
                  onSave={handlePressSave}
                  cancelLabel="삭제하기"
                  saveLabel="저장하기"
                  showCancel={true}
                />
              ) : (
                <BottomSheetButtons
                  onSave={handlePressSave}
                  saveLabel="저장"
                  showCancel={false}
                />
              )}
            </BottomSheetView>
          </TouchableWithoutFeedback>
        </KinoBottomSheet>

        {/* ✅ 토스트 모달 */}
        <ToastModal
          visible={toastVisible}
          onClose={hideToast}
          message={toastMessage}
        />
      </>
    );
  },
);

ScheduleEditorBottomSheetModal.displayName = 'ScheduleEditorBottomSheetModal';

export default ScheduleEditorBottomSheetModal;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveWidth(22),
    paddingTop: getResponsiveHeight(15),
    paddingBottom: getResponsiveHeight(20),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: getResponsiveHeight(8),
  },
  sheetTitle: {
    fontSize: getResponsiveFontSize(16.5),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
  sheetSubtitle: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
    marginBottom:getResponsiveHeight(10),
  },
  subTitle: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: '#4B5563',
    marginBottom: getResponsiveHeight(4),
  },

  userScrollWrapper: {
    position: 'relative',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: getResponsiveHeight(16),
  },
  userScroll: {
    borderRadius: 12,
  },
  rightFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: getResponsiveWidth(36),
  },
  avatarColumn: {
    width: getResponsiveWidth(68),
    height: getResponsiveHeight(95),
    marginLeft: getResponsiveWidth(8),
    marginRight: getResponsiveWidth(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: getResponsiveIconSize(60),
    height: getResponsiveIconSize(60),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  avatarBtnSelected: {
    borderColor: '#FFC84D',
    backgroundColor: '#FFF8E1',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  avatarImageSelected: {
    borderWidth: 0,
  },
  avatarLabel: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: '#374151',
    textAlign: 'center',
    marginTop: getResponsiveHeight(6),
  },
  allText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: '#9CA3AF',
  },
  allTextSelected: {
    color: '#4B5563',
  },
  checkBadge: {
    position: 'absolute',
    width: getResponsiveWidth(20),
    height: getResponsiveWidth(20),
    resizeMode: 'contain',
  },

  input: {
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical:
      Platform.OS === 'android'
        ? getResponsiveHeight(8)
        : getResponsiveHeight(10),
    height: getResponsiveHeight(100),
    marginBottom: getResponsiveHeight(8),
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: '#111827',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(10),
    marginTop: getResponsiveHeight(10),
  },
  button: {
    flex: 1,
    paddingVertical: getResponsiveHeight(11),
    borderRadius: 9,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#F9FAFB',
  },
  saveButton: {
    backgroundColor: '#111827',
  },
  buttonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14.5),
    color: 'white',
  },
  deleteButtonText: {
    color: '#6B7280',
  },
});

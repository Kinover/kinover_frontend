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
  Alert, // ✅ 추가
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import LinearGradient from 'react-native-linear-gradient'; // ✅ 그라데이션 추가
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {useScheduleBottomSheetModal} from '../hooks/useScheduleBottomSheetModal';
import {useIsAllSelected} from '../hooks/useIsAllSelected';

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
      // canSave, // ✅ 더 이상 사용 안 함
    } = useScheduleBottomSheetModal({
      editingSchedule,
      title,
      setTitle,
      onSubmit,
      onDelete,
      onRefresh,
    });

    const isSelectedAll = useIsAllSelected(selectedUserId);

    // ✅ 스크롤 가능 여부 → 끝부분 그라데이션 표시용
    const [scrollContainerWidth, setScrollContainerWidth] = useState(0);
    const [canScroll, setCanScroll] = useState(false);

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }));

    // ✅ 저장 버튼 클릭 시: 항상 활성화지만, 내용 없으면 Alert만 띄우고 저장 막기
    const handlePressSave = () => {
      const text = scheduleRef.current || '';
      if (!text.trim()) {
        Alert.alert('안내', '일정 내용을 입력해주세요.');
        return;
      }
      handleSave();
    };

    return (
      <BottomSheetModal
        ref={modalRef}
        index={0}
        snapPoints={snapPoints}
        animateOnMount={true}
        enableContentPanningGesture={false}
        backgroundStyle={{backgroundColor: 'white'}}
        handleIndicatorStyle={{width: 0}}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}>
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            modalRef.current?.snapToIndex(0);
          }}>
          <BottomSheetView style={styles.container}>
            <View style={styles.titleRow}>
              <Text style={styles.sheetTitle}>
                {editingSchedule ? '일정 수정' : '일정 추가'}
              </Text>
            </View>
            <Text style={styles.subTitle}>
              일정을 등록할 가족을 선택해주세요
            </Text>
            {/* ✅ 가족 선택 리스트 + 오른쪽 그라데이션 페이드 */}
            <View
              style={styles.userScrollWrapper}
              onLayout={e =>
                setScrollContainerWidth(e.nativeEvent.layout.width)
              }>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={{paddingVertical: 5}}
                style={styles.userScroll}
                onContentSizeChange={(contentWidth, _h) => {
                  setCanScroll(contentWidth > scrollContainerWidth + 8);
                }}>
                {/* ALL 버튼 */}
                <View
                  style={{
                    width: 70,
                    height: 95,
                    marginLeft: 6,
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <TouchableOpacity
                    style={[
                      styles.avatarBtn,
                      {
                        borderColor: isSelectedAll ? '#FFC84D' : '#E0E0E0',
                        backgroundColor: isSelectedAll ? '#FFF5D1' : 'white',
                        borderWidth: isSelectedAll ? 2 : 1,
                      },
                    ]}
                    onPress={() => setSelectedUserId('')}>
                    {isSelectedAll && (
                      <View
                        style={{
                          ...StyleSheet.absoluteFillObject,
                          borderRadius: 999,
                          backgroundColor: 'rgba(0,0,0,0.1)',
                        }}
                      />
                    )}
                    {isSelectedAll && (
                      <Image
                        source={require('../../../assets/icons/check-yellow.png')}
                        style={styles.checkIcon}
                      />
                    )}
                    <Text
                      style={{
                        fontSize: getResponsiveFontSize(13),
                        fontFamily: 'Pretendard-Bold',
                        color: isSelectedAll ? 'gray' : '#C3C3C3',
                        zIndex: 10,
                        alignSelf: 'center',
                      }}>
                      ALL
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.avatarLabel}>전체</Text>
                </View>

                {/* 가족 리스트 */}
                {familyUserList.map(user => {
                  const isSel = selectedUserId === user.userId;
                  return (
                    <View
                      key={user.userId}
                      style={{
                        width: 70,
                        height: 95,
                        marginRight: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <TouchableOpacity
                        style={[styles.avatarBtn]}
                        onPress={() => setSelectedUserId(user.userId)}>
                        {isSel && (
                          <View
                            style={{
                              ...StyleSheet.absoluteFillObject,
                              borderRadius: 999,
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              zIndex: 10,
                              borderWidth: 2,
                              borderColor: '#FFC84D',
                            }}
                          />
                        )}
                        {isSel && (
                          <Image
                            source={require('../../../assets/icons/check-yellow.png')}
                            style={styles.checkIcon}
                          />
                        )}
                        <Image
                          source={{uri: user.image}}
                          style={[
                            styles.avatarImage,
                            {
                              borderColor: isSel ? '#FFC84D' : '#E0E0E0',
                              borderWidth: isSel ? 2 : 0,
                            },
                          ]}
                        />
                      </TouchableOpacity>
                      <Text style={styles.avatarLabel}>{user.name}</Text>
                    </View>
                  );
                })}
              </ScrollView>

              {/* ✅ 오른쪽 끝 흰색 그라데이션 페이드 */}
              {canScroll && (
                <LinearGradient
                  pointerEvents="none"
                  colors={[
                    'rgba(255,255,255,0)', // 완전 투명
                    'rgba(255,255,255,0.08)', // 살짝
                    'rgba(255,255,255,0.3)', // 중간
                    'rgba(255,255,255,0.7)', // 거의 흰색
                    'rgba(255,255,255,1)', // 완전 흰색
                  ]}
                  locations={[0, 0.25, 0.55, 0.8, 1]}
                  start={{x: 0, y: 0.5}}
                  end={{x: 1, y: 0.5}}
                  style={styles.rightFade}
                />
              )}
            </View>

            {/* 입력 필드 */}
            <Text style={styles.subTitle}>일정 내용을 입력해주세요</Text>
            <BottomSheetTextInput
              key={`input-${inputKey}`}
              defaultValue={scheduleRef.current}
              onChangeText={text => (scheduleRef.current = text)}
              onFocus={() =>
                setTimeout(() => modalRef.current?.snapToIndex(1), 50)
              }
              placeholder="예) 병원 예약, 가족 모임"
              placeholderTextColor={'lightgray'}
              style={styles.input}
              autoCorrect={false}
              autoCapitalize="none"
              multiline
              autoComplete="off"
              spellCheck={false}
              importantForAutofill="no"
            />

            {/* 버튼들 */}
            <View style={styles.buttonRow}>
              {editingSchedule && (
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={handleDelete}>
                  <Text style={[styles.buttonText, {color: '#A1A5AF'}]}>
                    삭제
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.saveButton]} // ✅ 항상 활성화
                onPress={handlePressSave}>
                {/* ✅ 내부에서 검사 */}
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </TouchableWithoutFeedback>
      </BottomSheetModal>
    );
  },
);

ScheduleEditorBottomSheetModal.displayName = 'ScheduleEditorBottomSheetModal';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveWidth(22),
    paddingBottom: getResponsiveHeight(26),
  },
  sheetTitle: {
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(18)
        : getResponsiveFontSize(19),
    fontFamily: 'Pretendard-Bold',
    fontWeight: '700',
    marginBottom: getResponsiveHeight(8),
    color: '#222',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subTitle: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-Regular',
    color: '#808080',
    fontWeight: Platform.OS === 'android' ? '500' : undefined,
    marginBottom: getResponsiveHeight(10),
    marginTop: getResponsiveHeight(4),
  },

  // ✅ 유저 스크롤 래퍼 + 그라데이션 영역
  userScrollWrapper: {
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
  },
  userScroll: {
    backgroundColor: 'white',
    borderRadius: 10,
  },
  rightFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: getResponsiveWidth(40),
  },

  avatarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: getResponsiveIconSize(70),
    height: getResponsiveIconSize(70),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    overflow: 'visible',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    objectFit: 'cover',
    zIndex: 0,
  },
  avatarLabel: {
    fontSize:
      Platform.OS === 'ios'
        ? getResponsiveFontSize(12.5)
        : getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    textAlign: 'center',
    marginTop: getResponsiveHeight(5),
  },
  checkIcon: {
    position: 'absolute',
    width: getResponsiveWidth(22),
    height: getResponsiveHeight(22),
    top: getResponsiveIconSize(20.5),
    right: getResponsiveIconSize(20.5),
    resizeMode: 'contain',
    objectFit: 'contain',
    zIndex: 11,
  },
  input: {
    textAlignVertical: 'top',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 12,
    height: getResponsiveHeight(100),
    marginBottom: 10,
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: '#222',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: getResponsiveHeight(10),
  },
  button: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(14),
  },
  deleteButton: {
    backgroundColor: '#F4F6FA',
  },
  saveButton: {
    backgroundColor: '#FFC84D',
  },
  buttonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14.5),
    color: 'white',
  },
});

export default ScheduleEditorBottomSheetModal;

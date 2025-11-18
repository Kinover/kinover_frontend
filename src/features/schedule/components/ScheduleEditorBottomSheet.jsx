/* eslint-disable react-native/no-inline-styles */
import React, {forwardRef, useImperativeHandle} from 'react';
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
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView
} from '@gorhom/bottom-sheet';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

import { useScheduleBottomSheetModal } from '../hooks/useScheduleBottomSheetModal';
import { useIsAllSelected } from '../hooks/useIsAllSelected';

ScheduleEditorBottomSheetModal.displayName = 'ScheduleEditorBottomSheetModal';
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
      canSave,
    } = useScheduleBottomSheetModal({
      editingSchedule,
      title,
      setTitle,
      onSubmit,
      onDelete,
      onRefresh,
    });

    const isSelectedAll = useIsAllSelected(selectedUserId);

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }));

    return (
      <BottomSheetModal
        ref={modalRef}
        index={1}
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

            {/* 가족 선택 리스트 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{paddingVertical: 5}}
              style={{
                backgroundColor: 'white',
                borderRadius: 10,
                marginBottom: 20,
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
                      source={require('../../assets/icons/check-yellow.png')}
                      style={styles.checkIcon}
                    />
                  )}
                  <Text
                    style={{
                      fontSize: getResponsiveFontSize(14),
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
                          source={require('../../assets/icons/check-yellow.png')}
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
                style={[
                  styles.button,
                  styles.saveButton,
                  !canSave && {opacity: 0.5},
                ]}
                onPress={canSave ? handleSave : undefined}>
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </TouchableWithoutFeedback>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveWidth(25),
    paddingBottom: getResponsiveHeight(30),
  },
  sheetTitle: {
    fontSize: getResponsiveFontSize(22),
    fontFamily: 'Pretendard-Bold',
    fontWeight: 'bold',
    marginBottom: getResponsiveHeight(10),
    color: '#222',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subTitle: {
    fontSize: getResponsiveFontSize(16.5),
    fontFamily: 'Pretendard-Light',
    color: 'gray',
    fontWeight: Platform.OS === 'android' ? '600' : '500',
    marginBottom: getResponsiveHeight(12),
    marginTop: getResponsiveHeight(5),
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
        ? getResponsiveFontSize(14)
        : getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    textAlign: 'center',
    marginTop: getResponsiveHeight(6),
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
    padding: 14,
    height: getResponsiveHeight(100),
    marginBottom: 10,
    fontSize: getResponsiveFontSize(15),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: getResponsiveHeight(10),
  },
  button: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(17),
  },
  deleteButton: {
    backgroundColor: '#F4F6FA',
  },
  saveButton: {
    backgroundColor: '#FFC84D',
  },
  buttonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(16),
    color: 'white',
  },
});

export default ScheduleEditorBottomSheetModal;

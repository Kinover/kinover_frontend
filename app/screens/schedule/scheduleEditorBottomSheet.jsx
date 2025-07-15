import React, {forwardRef, useImperativeHandle, useRef} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import {BottomSheetView} from '@gorhom/bottom-sheet';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../utils/responsive';

const ScheduleEditorBottomSheetModal = forwardRef((props, ref) => {
  const {
    editingSchedule,
    familyUserList,
    selectedUserId,
    setSelectedUserId,
    title,
    setTitle,
    onSubmit,
    onDelete,
    onCancelEdit,
  } = props;

  const modalRef = useRef(null);
  const snapPoints = ['50%'];

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));

  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={snapPoints}
      handleComponent={() => null}
      keyboardBehavior="interactive" // ✅ 키보드와 상호작용
      keyboardBlurBehavior="restore" // ✅ 포커스 해제 시 원위치
      backgroundStyle={{backgroundColor: 'white'}}
      backdropComponent={props => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      )}>
      <BottomSheetView
        style={{
          paddingHorizontal: getResponsiveWidth(30),
          paddingTop: getResponsiveHeight(30),
          paddingBottom: getResponsiveHeight(60),
        }}
        keyboardBehavior="extend" // ✅ 추천 옵션
        keyboardBlurBehavior="restore">
        <View style={styles.titleRow}>
          <Text style={styles.sheetTitle}>
            {editingSchedule ? '일정 수정' : '일정 추가'}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: getResponsiveWidth(10),
            }}>
            {editingSchedule && (
              <TouchableOpacity onPress={onCancelEdit}>
                <Image
                  source={require('../../assets/images/back_.png')}
                  style={styles.cancelIcon}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => modalRef.current?.dismiss()}>
              <Image
                source={require('../../assets/images/close-yellow.png')}
                style={styles.exitIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.subTitle}>유저 선택</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginBottom: 20}}>
          <TouchableOpacity
            onPress={() => setSelectedUserId(null)}
            style={{
              alignItems: 'center',
              marginRight: 12,
              padding: 6,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: selectedUserId === null ? '#FFC84D' : '#E0E0E0',
              backgroundColor: selectedUserId === null ? '#FFF5D1' : 'white',
              width: 60,
              height: 80,
              justifyContent: 'center',
            }}>
            <Text
              style={{
                fontSize: getResponsiveFontSize(11),
                fontFamily: 'Pretendard-Regular',
              }}>
              전체
            </Text>
          </TouchableOpacity>

          {familyUserList.map(user => (
            <TouchableOpacity
              key={user.userId}
              onPress={() => setSelectedUserId(user.userId)}
              style={{
                alignItems: 'center',
                marginRight: 12,
                padding: 6,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor:
                  selectedUserId === user.userId ? '#FFC84D' : '#E0E0E0',
                backgroundColor:
                  selectedUserId === user.userId ? '#FFF5D1' : 'white',
              }}>
              <Image
                source={{uri: user.image}}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  marginBottom: 6,
                }}
              />
              <Text
                style={{
                  fontSize: getResponsiveFontSize(11),
                  fontFamily: 'Pretendard-Regular',
                }}>
                {user.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.subTitle}>일정 내용</Text>

        <BottomSheetTextInput
          value={title}
          onChangeText={setTitle}
          placeholder="제목을 입력하세요"
          placeholderTextColor="#BDBDBD"
          style={styles.input}
        />

        <View style={styles.buttonRow}>
          {editingSchedule && (
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onDelete}>
              <Text style={styles.buttonText}>삭제</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={onSubmit}>
            <Text style={[styles.buttonText, {color: 'white'}]}>저장</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheetTitle: {
    fontSize: getResponsiveFontSize(23),
    fontFamily: 'Pretendard-SemiBold',
    color: '#333',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelIcon: {
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(18),
    resizeMode: 'contain',
  },
  exitIcon: {
    width: getResponsiveIconSize(15),
    height: getResponsiveIconSize(13),
    resizeMode: 'contain',
  },
  input: {
    borderRadius: 12,
    padding: 13,
    backgroundColor: '#EDEDED',
    fontFamily: 'Pretendard-Regular',
    marginBottom: 20,
    fontSize: getResponsiveFontSize(13),
    color: '#212121',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 13,
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(12),
  },
  deleteButton: {
    backgroundColor: '#F2F2F2',
  },
  saveButton: {
    backgroundColor: '#FFC84D',
  },
  buttonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(15),
    alignSelf: 'center',
  },
  subTitle: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: '#9D9D9D',
    marginBottom: getResponsiveHeight(10),
  },
});

export default ScheduleEditorBottomSheetModal;

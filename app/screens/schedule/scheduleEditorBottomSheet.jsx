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
import {BlurView} from '@react-native-community/blur';

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
  const snapPoints = ['80%'];

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));
  const isSelectedAll = selectedUserId === null || selectedUserId === '';

  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={{backgroundColor: 'white'}}
      handleIndicatorStyle={{backgroundColor: '#ccc', width: 55}} // 색과 크기 조절 가능
      keyboardBehavior="extend" // ✅ 키보드와 상호작용
      keyboardBlurBehavior="restore" // ✅ 포커스 해제 시 원위치
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
          paddingVertical: getResponsiveWidth(20),
          paddingBottom: getResponsiveHeight(60),
        }}>
        <View style={styles.titleRow}>
          <Text style={styles.sheetTitle}>
            {editingSchedule ? '일정 수정' : '일정 추가'}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: getResponsiveWidth(10),
            }}></View>
        </View>

        <Text style={styles.subTitle}>유저를 선택해주세요</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginBottom: 35}}>
          <TouchableOpacity style={{width: 70, height: 95, marginRight: 12}}>
            <TouchableOpacity
              onPress={() => setSelectedUserId('')}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 70,
                height: 70,
                borderRadius: 35,
                borderWidth: 2,
                borderColor: isSelectedAll ? '#FFC84D' : '#E0E0E0',
                backgroundColor: isSelectedAll ? '#FFF5D1' : 'white',
                overflow: 'hidden',
              }}>
              {isSelectedAll && (
                <>
                  <BlurView
                    style={[
                      StyleSheet.absoluteFill,
                      {zIndex: 10, borderRadius: 35},
                    ]}
                    blurType="dark"
                    blurAmount={0.5}
                    reducedTransparencyFallbackColor="#FFF"
                  />
                  <Image
                    source={require('../../assets/icons/check-yellow.png')}
                    style={{
                      position: 'absolute',
                      width: getResponsiveWidth(22.5),
                      height: getResponsiveHeight(22.5),
                      top: getResponsiveHeight(20),
                      zIndex: 11,
                      resizeMode: 'contain',
                      alignSelf: 'center',
                    }}
                  />
                </>
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
            <Text
              style={{
                fontSize: getResponsiveFontSize(13),
                fontFamily: 'Pretendard-Regular',
                color: 'black',
                zIndex: 11,
                alignSelf: 'center',
                marginTop: getResponsiveHeight(5),
              }}>
              전체
            </Text>
          </TouchableOpacity>

          {familyUserList.map(user => {
            const isSelected = selectedUserId === user.userId;

            return (
              <TouchableOpacity
                key={user.userId}
                style={{width: 70, height: 95, marginRight: 12}}>
                <TouchableOpacity
                  onPress={() => setSelectedUserId(user.userId)}
                  style={{
                    alignContent: 'center',
                    alignItems: 'center',
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    zIndex: 9,
                    marginBottom: getResponsiveHeight(5),
                    borderWidth: isSelected ? 2 : null,
                    borderColor: isSelected ? '#FFC84D' : '#E0E0E0',
                    overflow: 'hidden',
                  }}>
                  {isSelected && (
                    <BlurView
                      style={[
                        StyleSheet.absoluteFill,
                        {zIndex: 10, borderRadius: 35},
                      ]}
                      blurType="dark"
                      blurAmount={0.5}
                      reducedTransparencyFallbackColor="#FFF"
                    />
                  )}
                  {isSelected && (
                    <Image
                      source={require('../../assets/icons/check-yellow.png')}
                      style={{
                        position: 'absolute',
                        width: getResponsiveWidth(22.5),
                        height: getResponsiveHeight(22.5),
                        top: getResponsiveHeight(20),
                        zIndex: 11,
                        resizeMode: 'contain',
                        alignSelf: 'center',
                      }}
                    />
                  )}

                  <Image
                    source={{uri: user.image}}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 35,
                    }}
                  />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: getResponsiveFontSize(13),
                    fontFamily: 'Pretendard-Regular',
                    color: 'black',
                    zIndex: 11,
                    alignSelf: 'center',
                  }}>
                  {user.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.subTitle}>일정을 입력해주세요</Text>

        <BottomSheetTextInput
          value={title}
          onChangeText={setTitle}
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
            <Text style={[styles.buttonText, {color: 'black'}]}>저장</Text>
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
    marginBottom: getResponsiveHeight(20),
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
  input: {
    borderRadius: 9,
    padding: 13,
    backgroundColor: '#FFF8E9',
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
    borderRadius: 9,
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

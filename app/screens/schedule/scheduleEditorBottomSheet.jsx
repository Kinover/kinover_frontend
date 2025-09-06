import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import {InteractionManager} from 'react-native';

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
} from '@gorhom/bottom-sheet';
import {BottomSheetView} from '@gorhom/bottom-sheet';
import {BlurView} from '@react-native-community/blur';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';

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
    const modalRef = useRef(null);
    const snapPoints = useMemo(() => ['55%', '80%'], []);

    const scheduleRef = useRef(title ?? '');
    const [inputKey, setInputKey] = useState(0);

    const isSelectedAll = useMemo(() => !selectedUserId, [selectedUserId]);

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }));

    // editingSchedule or title 변경 시 Ref, key 리셋
    useEffect(() => {
      scheduleRef.current = title ?? '';
      setInputKey(k => k + 1);
    }, [editingSchedule, title]);

    const handleSave = async () => {
      const final = scheduleRef.current?.trim();
      if (!final) return;
      setTitle(final);
      await onSubmit(final);
      await onRefresh?.();
      modalRef.current?.dismiss();
    };

    const handleDelete = async () => {
      if (!onDelete) return;
      await onDelete();
      await onRefresh?.();
      modalRef.current?.dismiss();
    };

    const canSave = scheduleRef.current?.trim().length > 0;

    return (
      <BottomSheetModal
        ref={modalRef}
        index={1} // 완전히 숨긴 상태로 시작
        snapPoints={snapPoints}
        animateOnMount={true} // 내부 상태 초기화 보장
        enableContentPanningGesture={false}
        backgroundStyle={{backgroundColor: 'white'}}
        // handleIndicatorStyle={{backgroundColor: '#ccc', width: 55}}
        handleIndicatorStyle={{width:0}}
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

            <Text style={styles.subTitle}>일정을 등록할 가족을 선택해주세요</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{paddingVertical:5 
              }}
              style={{backgroundColor:'white', borderRadius:10, marginBottom: 20}}>
              <View style={{width: 70, height: 95, marginLeft: 6,marginRight: 12, alignItems:'center',justifyContent:'center'}}>
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

              {familyUserList.map(user => {
                const isSel = selectedUserId === user.userId;
                return (
                  <View
                    key={user.userId}
                    style={{width: 70, height: 95, marginRight: 12,alignItems:'center',justifyContent:'center'}}>
                    <TouchableOpacity
                      key={user.userId}
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

            <Text style={styles.subTitle}>일정 내용을 입력해주세요</Text>
            <BottomSheetTextInput
              key={`input-${inputKey}`}
              defaultValue={scheduleRef.current}
              onChangeText={text => (scheduleRef.current = text)}
              onFocus={() =>
                setTimeout(() => modalRef.current?.snapToIndex(2), 50)
              }
              placeholder="예) 병원 예약, 가족 모임"
              placeholderTextColor={"lightgray"}
              style={styles.input}
              autoCorrect={false}
              autoCapitalize="none"
              multiline
              autoComplete="off"
              spellCheck={false}
              importantForAutofill="no"
            />
            <View style={styles.buttonRow}>
              {editingSchedule && (
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={handleDelete}>
                  <Text style={[styles.buttonText, {color: '#A1A5AF'}]}>
                    {'삭제'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  // !canSave && {opacity: 0.5},
                ]}
                onPress={handleSave}>
                <Text style={styles.buttonText}>{'저장'}</Text>
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
    // paddingTop: getResponsiveHeight(25),
    paddingBottom: getResponsiveHeight(30),
  },

  // ✅ 시트 타이틀
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

  // ✅ 섹션 타이틀
  subTitle: {
    fontSize: getResponsiveFontSize(16.5),
    fontFamily:'Pretendard-Light',
    color: 'gray',
    fontWeight:Platform.OS==='android'?'600':'500',
    marginBottom: getResponsiveHeight(12),
    marginTop: getResponsiveHeight(5),
  },

  // ✅ 아바타 버튼
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
    fontSize: Platform.OS==='ios'?getResponsiveFontSize(14):getResponsiveFontSize(12.5),
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

  // ✅ 입력 필드F9F9F9
  input: {
    textAlignVertical:'top',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 14,
    height:getResponsiveHeight(100),
    marginBottom: 10,
    fontSize: getResponsiveFontSize(15),
  },

  // ✅ 버튼 행
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
    // borderWidth: 1,
    // borderColor: '#D1D5DB',
  },
  saveButton: {
    backgroundColor: '#FFC84D',
  },
  buttonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(16),
    color: 'white',
  },
  saveButtonText: {
    color: '#fff',
  },
});

export default ScheduleEditorBottomSheetModal;

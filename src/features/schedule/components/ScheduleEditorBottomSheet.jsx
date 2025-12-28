/* eslint-disable react-native/no-inline-styles */
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  Text,
  View,
  StyleSheet,
  Platform,
  Image,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  Animated,
  Dimensions,
} from 'react-native';
import {
  BottomSheetTextInput,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {useScheduleBottomSheetModal} from '../hooks/useScheduleBottomSheetModal';
import {useIsAllSelected} from '../hooks/useIsAllSelected';
import ToastModal from '../../../components/ToastModal';
import BottomSheetLayout from 'components/BottomSheetLayout';

const {height: WINDOW_H} = Dimensions.get('window');
const SAFE_GAP = 12;

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
    const {modalRef, scheduleRef, inputKey, handleSave, handleDelete} =
      useScheduleBottomSheetModal({
        editingSchedule,
        title,
        setTitle,
        onSubmit,
        onDelete,
        onRefresh,
      });

    const isSelectedAll = useIsAllSelected(selectedUserId);

    const [scrollContainerWidth, setScrollContainerWidth] = useState(0);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isClosing, setIsClosing] = useState(false);

    // ✅ 1) “콘텐츠 양만큼 높이” (CONTENT_HEIGHT는 훅과 같이 써야 유효)
    const initialSnapPoints = useMemo(() => ['CONTENT_HEIGHT'], []);
    const {
      animatedSnapPoints,
      animatedHandleHeight,
      animatedContentHeight,
      handleContentLayout,
    } = useBottomSheetDynamicSnapPoints(initialSnapPoints);

    // ✅ 2) 키보드 떠도 시트/버튼이 밀리지 않게(=시트는 고정)
    // ✅ 3) 대신 입력만 가리면 콘텐츠만 위로 올리기
    const shiftAnim = useRef(new Animated.Value(0)).current;
    const keyboardHeightRef = useRef(0);
    const inputRef = useRef(null);

    const showToast = msg => {
      setToastMessage(msg);
      setToastVisible(true);
    };
    const hideToast = () => setToastVisible(false);

    useImperativeHandle(ref, () => ({
      present: () => {
        setIsClosing(false);
        // 열릴 때 보정 초기화
        Animated.timing(shiftAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();
        modalRef.current?.present();
      },
      dismiss: () => {
        setIsClosing(true);
        modalRef.current?.dismiss();
      },
    }));

    // ✅ 키보드 높이 추적 + 내려가면 복구
    useEffect(() => {
      const onShow = e => {
        keyboardHeightRef.current = e?.endCoordinates?.height || 0;
      };
      const onHide = () => {
        keyboardHeightRef.current = 0;
        Animated.timing(shiftAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }).start();
      };

      const subShow = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        onShow,
      );
      const subHide = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        onHide,
      );

      return () => {
        subShow.remove();
        subHide.remove();
      };
    }, [shiftAnim]);

    const ensureVisible = refNode => {
      const kbH = keyboardHeightRef.current || 0;
      if (!kbH) return;

      const keyboardTopY = WINDOW_H - kbH;

      requestAnimationFrame(() => {
        const node = refNode?.current;
        if (!node || typeof node.measureInWindow !== 'function') return;

        node.measureInWindow((x, y, w, h) => {
          const inputBottomY = y + h;
          const limitY = keyboardTopY - SAFE_GAP;

          if (inputBottomY <= limitY) {
            Animated.timing(shiftAnim, {
              toValue: 0,
              duration: 140,
              useNativeDriver: true,
            }).start();
            return;
          }

          const diff = inputBottomY - limitY;

          Animated.timing(shiftAnim, {
            toValue: -diff, // ✅ 콘텐츠만 위로
            duration: 180,
            useNativeDriver: true,
          }).start();
        });
      });
    };

    const handlePressSave = async () => {
      const text = scheduleRef.current || '';
      if (!text.trim()) {
        showToast('일정 내용을 입력해주세요.');
        return;
      }

      setIsClosing(true);
      await handleSave();
    };

    const handlePressDelete = async () => {
      setIsClosing(true);
      await handleDelete();
    };

    return (
      <>
        <BottomSheetLayout
          modalRef={modalRef}
          // ✅ 콘텐츠 기반 높이
          snapPoints={animatedSnapPoints}
          handleHeight={animatedHandleHeight}
          contentHeight={animatedContentHeight}
          onContentLayout={handleContentLayout}
          // ✅ 키보드가 시트/버튼을 밀지 않게
          keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'none'}
          androidKeyboardInputMode="adjustNothing"
          title={editingSchedule ? '일정 수정' : '일정 추가'}
          subtitle="가족과 일정을 공유해요"
          // ✅ 버튼 고정 X (BottomSheetLayout 내부에서 마지막 요소로 렌더)
          useFixedFooter={false}
          footerProps={
            editingSchedule
              ? {
                  onCancel: handlePressDelete,
                  onSave: handlePressSave,
                  cancelLabel: '삭제하기',
                  saveLabel: '저장하기',
                }
              : {
                  onSave: handlePressSave,
                  saveLabel: '저장',
                  showCancel: false,
                }
          }
          // ✅ 입력 가리면 콘텐츠만 올리기
          contentTranslateY={shiftAnim}>
          <View>
            {/* 구성원 선택 */}
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
                  // canScroll state 지우고 싶으면 지워도 됨 (현재 코드에서는 사용 안함)
                  // contentWidth > scrollContainerWidth + 8
                }}>
                {/* ALL */}
                <View style={styles.avatarColumn}>
                  <TouchableOpacity
                    style={[
                      styles.avatarBtn,
                      isSelectedAll && styles.avatarBtnSelected,
                    ]}
                    onPress={() => !isClosing && setSelectedUserId('')}>
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
                        onPress={() =>
                          !isClosing && setSelectedUserId(user.userId)
                        }>
                        <Image
                          source={{uri: user.image}}
                          style={[
                            styles.avatarImage,
                            isSel && styles.avatarImageSelected,
                          ]}
                          blurRadius={isSel ? 3 : 0}
                        />
                        {isSel && <View style={styles.avatarOverlay} />}
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
            </View>

            {/* 일정 내용 입력 */}
            <Text style={styles.subTitle}>일정 내용</Text>
            <BottomSheetTextInput
              ref={inputRef}
              key={`input-${inputKey}`}
              defaultValue={scheduleRef.current}
              onChangeText={text => {
                if (!isClosing) scheduleRef.current = text;
              }}
              onFocus={() => ensureVisible(inputRef)}
              placeholder="예) 병원 예약, 가족 모임"
              placeholderTextColor="#B0B0B0"
              style={[styles.input, {marginBottom: getResponsiveHeight(12.5)}]}
              multiline
            />
          </View>
        </BottomSheetLayout>

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
  subTitle: {
    fontSize: getResponsiveFontSize(13),
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
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: '#111827',
  },

  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
});

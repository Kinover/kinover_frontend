import React, {useState, useEffect, useLayoutEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {createChatRoomThunk} from '../store/chatRoomThunk';
import {fetchFamilyUserListThunk} from '../../home/store/familyUserThunk';
import {CommonActions} from '@react-navigation/native';
import {
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import useHideTabBar from '../../../hooks/useHideTabBar';
import ToastModal from '../../../components/ToastModal'; // ✅ 추가
import {HEADER_STYLES, LAYOUT_STYLE} from 'styles/style';

export default function CreateChatRoom({navigation}) {
  const dispatch = useDispatch();
  const family = useSelector(state => state.family);
  const currentUserId = useSelector(state => state.user.userId);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const loading = useSelector(state => state.userFamily.loading);

  const [selected, setSelected] = useState([]);
  const [toastVisible, setToastVisible] = useState(false); // ✅ 토스트 상태 추가

  useHideTabBar();

  useEffect(() => {
    if (family.familyId) {
      dispatch(fetchFamilyUserListThunk(family.familyId));
    }
  }, [dispatch, family.familyId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Text style={styles.headerTitle}>채팅방 만들기</Text>,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleCreateChatRoom}
          style={{marginRight: getResponsiveWidth(10)}}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={styles.headerCheckIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selected]);

  const toggleUser = userId => {
    setSelected(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };

  const handleCreateChatRoom = async () => {
    if (selected.length === 0) return;

    const idsStr = selected.join(',');

    const selectedUserNames = selectableUsers
      .filter(user => selected.includes(user.userId))
      .map(user => user.name);

    const autoRoomName = selectedUserNames.join(', ');

    try {
      await dispatch(
        createChatRoomThunk({
          roomName: autoRoomName,
          userIds: idsStr,
          familyId: family.familyId,
        }),
      ).unwrap();

      // ✅ 성공 시 토스트 띄우기
      setToastVisible(true);

      // ✅ 일정 시간 후 "소통" 화면으로 이동
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: '소통'}],
          }),
        );
      }, 1200);
    } catch (err) {
      console.error('🔴 채팅방 생성 실패:', err);
    }
  };

  const selectableUsers = familyUserList.filter(
    user => user.userId !== currentUserId,
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#F8B500" />
      ) : (
        <ScrollView>
          {selectableUsers.map(user => {
            const isSelected = selected.includes(user.userId);
            return (
              <TouchableOpacity
                key={user.userId}
                onPress={() => toggleUser(user.userId)}
                style={[
                  styles.userItem,
                  isSelected && styles.userItemSelected,
                ]}>
                <View style={styles.userInfo}>
                  <Image source={{uri: user.image}} style={styles.userImage} />
                  <Text style={styles.userName}>{user.name}</Text>
                </View>
                <Image
                  source={
                    isSelected
                      ? require('../../../assets/images/selected-bt.png')
                      : require('../../../assets/images/unselected-bt.png')
                  }
                  style={styles.selectIcon}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ✅ 채팅방 생성 완료 토스트 */}
      <ToastModal
        visible={toastVisible}
        message="채팅방을 생성했어요"
        onClose={() => setToastVisible(false)}
        duration={1000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 2,
    borderColor: 'lightgray',
  },
  headerTitle: {
    fontSize: HEADER_STYLES.defaultTitleFontSize, // 🔽 18 → 17
    textAlign: 'center',
    fontFamily: HEADER_STYLES.defaultTitleFontFamily,
    color: HEADER_STYLES.defaultTitleFontColor,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(12),
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT_STYLE.screenPaddingHorizontal,
  },
  userItemSelected: {
    backgroundColor: '#FFF2CC',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(5),
  },
  userImage: {
    width: getResponsiveIconSize(45),
    height: getResponsiveIconSize(45),
    borderRadius: getResponsiveIconSize(22.5),
    marginRight: getResponsiveWidth(10),
    backgroundColor: '#eee',
  },
  userName: {
    fontSize: getResponsiveFontSize(15.5),
    fontFamily: 'Pretendard-Medium',
    color: '#101010',
    lineHeight: getResponsiveHeight(20),
    textAlignVertical: 'center',
  },
  selectIcon: {
    width: getResponsiveWidth(14),
    height: getResponsiveHeight(14),
    resizeMode: 'contain',
    marginRight: getResponsiveWidth(5),
  },
  headerCheckIcon: {
    width: getResponsiveWidth(24), // 🔽 30 → 24
    height: getResponsiveHeight(24), // 🔽 30 → 24
    marginRight: getResponsiveWidth(15),
    resizeMode: 'contain',
  },
});

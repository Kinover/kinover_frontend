import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  TextInput,
  Alert, // Alert 추가
} from 'react-native';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../utils/responsive';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {LOGIN} from '../../redux/actions/actionTypes';
import fetchFamily from '../../redux/actions/familyActions';

export default function FamilySetupScreen() {
  // 상태 정의: 코드 입력 여부 및 입력된 가족 코드
  const {error} = useSelector(state => state.family);
  const user = useSelector(state => state.user);
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [familyCode, setFamilyCode] = useState('');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (user.userId !== null && familyCode !== '') {
      dispatch(fetchFamily(familyCode));
      console.log(user.userId);
      console.log(user.image);
    }
  }, [dispatch, familyCode]);

  useEffect(() => {
    if (error) {
      // 에러가 있을 경우 Alert로 메시지 표시
      Alert.alert('오류', error, [{text: '확인'}]);
    }
  }, [error]); // error 상태가 바뀔 때마다 실행

  useEffect(() => {
    dispatch({type: LOGIN});
  }, []);

  const handleButtonClick = () => {
    setIsInputVisible(true); // 버튼 클릭 시 텍스트 입력 필드로 전환
  };

  const handleInputChange = text => {
    setFamilyCode(text); // 입력된 값 업데이트
  };

  const handleSubmitCode = () => {
    // 가족 코드가 입력된 경우 화면 전환
    console.log(familyCode); // 입력된 값 확인

    // 에러가 없고 가족 코드가 있을 때만 화면 전환
    if (familyCode && !error) {
      navigation.navigate('가족설정완료화면'); // 적절한 화면 이름으로 변경
    } else if (error) {
      // 에러가 있을 경우 알림을 띄우고 화면 전환을 막음
      Alert.alert('오류가 발생했습니다.', error, [{text: '확인'}]);
    } else {
      // 가족 코드가 비어있을 경우 안내 메시지
      alert('가족 코드를 입력해주세요.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>가족 모임이 있나요?</Text>
        <Text style={styles.headerSubTitle}>
          가족과 함께 특별한 순간을 만들어보세요!
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <Image
          style={styles.mainImage}
          source={{
            // uri: 'https://i.postimg.cc/fy1xtmp8/Group-1171276549.png',
            uri: 'https://i.postimg.cc/MppvqH7B/Group-1171276551-1.jpg',
          }}></Image>

        <View style={styles.buttonContainer}>
          {!isInputVisible ? (
            // 버튼을 클릭하면 텍스트 입력 필드로 바뀌도록 구현
            <TouchableOpacity style={styles.button} onPress={handleButtonClick}>
              <Text style={styles.buttonText}>
                가족 코드 입력하고 바로 참여해 보세요!
              </Text>
            </TouchableOpacity>
          ) : (
            // 텍스트 입력 필드
            <TextInput
              style={styles.inputField}
              placeholder="가족 코드 입력"
              value={familyCode}
              onSubmitEditing={handleSubmitCode}
              onChangeText={handleInputChange}
              keyboardType="numeric" // 가족 코드가 숫자일 경우 숫자 키패드 사용
            />
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('가족생성화면')}>
            <Text style={styles.buttonText}>새 가족 모임을 만들어보세요!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'white',
    paddingTop: getResponsiveHeight(35),
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'center',
    justifyContent: 'center',
    gap: getResponsiveHeight(5),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(25),
    justifyContent: 'center',
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
  },
  headerSubTitle: {
    fontSize: getResponsiveFontSize(15.6),
    justifyContent: 'center',
    textAlign: 'center',
    color: '#5F5F5F',
    fontFamily: 'Pretendard-Regular',
  },
  bottomContainer: {
    position: 'absolute',
    width: '100%',
    display: 'flex',
    height: 'auto',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: getResponsiveHeight(30),
    bottom: getResponsiveHeight(100),
  },
  mainImage: {
    width: getResponsiveWidth(319.66),
    height: getResponsiveHeight(156.48),
  },
  buttonContainer: {
    gap: getResponsiveHeight(10),
  },
  button: {
    backgroundColor: '#FFC84D',
    width: getResponsiveWidth(331),
    height: getResponsiveHeight(60),
    borderRadius: getResponsiveIconSize(10),
    justifyContent: 'center',
  },

  buttonText: {
    fontSize: getResponsiveFontSize(15.6),
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
  },
  inputField: {
    width: getResponsiveWidth(331),
    height: getResponsiveHeight(60),
    borderRadius: getResponsiveIconSize(10),
    backgroundColor: '#F0F0F0',
    paddingLeft: getResponsiveWidth(20),
    fontSize: getResponsiveFontSize(15.6),
    textAlign: 'center',
  },
});

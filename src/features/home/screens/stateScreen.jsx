import React, {useRef} from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  FlatList,
  Animated,
} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../../utils/responsive';
import useHideTabBar from '../../../hooks/useHideTabBar';
import {useDispatch, useSelector} from 'react-redux';
import {modifyUserThunk} from '../store/userThunk';
import {useNavigation} from '@react-navigation/native';
import BottomActionButton from 'components/BottomActionButton';
import FastImage from '@d11/react-native-fast-image';

const EMOTIONS = [
  {
    id: 'ANNOYED',
    label: '짜증나요',
    url: require('../../../assets/icons/state/annoyed.png'),
  },
  {
    id: 'WORRIED',
    label: '걱정돼요',
    url: require('../../../assets/icons/state/anxious.png'),
  },
  {
    id: 'DEPRESSED',
    label: '우울해요',
    url: require('../../../assets/icons/state/depressed.png'),
  },
  {
    id: 'SORRY',
    label: '미안해요',
    url: require('../../../assets/icons/state/sorry.png'),
  },
  {
    id: 'TIRED',
    label: '힘들어요',
    url: require('../../../assets/icons/state/exhausted.png'),
  },
  {
    id: 'EXCITED',
    label: '신나요',
    url: require('../../../assets/icons/state/excited.png'),
  },
  {
    id: 'NEUTRAL',
    label: '평범해요',
    url: require('../../../assets/icons/state/neutral.png'),
  },
  {
    id: 'HAPPY',
    label: '행복해요',
    url: require('../../../assets/icons/state/happy.png'),
  },
];

const EmotionItem = ({item, isSelected, onPress}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  // 선택 여부가 바뀔 때 부드럽게 색 전환
  React.useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 100, // 색 전환 속도 (ms)
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
  };

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['white', '#FFF5D1'], // 기본 → 선택된 색
  });

  const borderColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F4F4F4', '#FFC84D'],
  });

  return (
    <TouchableWithoutFeedback
      onPress={() => onPress(item.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.emotionBox,
          {
            transform: [{scale: scaleAnim}],
            backgroundColor,
            borderColor,
            borderWidth: 1.5,
          },
        ]}>
        <FastImage
          source={item.url}
          style={styles.emotionImage}
          resizeMode="contain"
        />
        <Text
          style={[
            styles.emotionText,
            isSelected && styles.emotionTextSelected,
          ]}>
          {item.label}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default function StateScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const [selectedEmotion, setSelectedEmotion] = React.useState(
    user.emotion || 'NEUTRAL',
  );

  useHideTabBar();

  const handleConfirm = () => {
    if (selectedEmotion) {
      dispatch(
        modifyUserThunk({
          userId: user.userId,
          trait: user.trait,
          emotion: selectedEmotion,
        }),
      )
        .then(() => {
          console.log('✅ 감정 저장 성공');
          navigation.goBack();
        })
        .catch(err => {
          console.error('❌ 감정 저장 실패:', err);
        });
    }
  };

  const renderEmotion = ({item}) => {
    const isSelected = selectedEmotion === item.id;
    return (
      <EmotionItem
        item={item}
        isSelected={isSelected}
        onPress={setSelectedEmotion}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>지금 나의 감정을 골라주세요</Text>
      <FlatList
        data={EMOTIONS}
        renderItem={renderEmotion}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <BottomActionButton
        label="선택 완료"
        onPress={() => handleConfirm()}></BottomActionButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: getResponsiveHeight(50),
    paddingHorizontal: getResponsiveWidth(20),
    backgroundColor: '#F9F9F9',
  },
  title: {
    color: 'black',
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-Regular',
    marginBottom: getResponsiveHeight(25),
    textAlign: 'center',
  },
  listContent: {
    alignItems: 'center',
    paddingBottom: getResponsiveHeight(40),
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(16),
  },
  emotionBox: {
    width: '45%',
    height: getResponsiveHeight(115),
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {width: 0, height: 2},
    shadowColor: '#000',
    shadowRadius: 5,
    shadowOpacity: 0.08,
    marginHorizontal: 10,
  },
  emotionImage: {
    width: getResponsiveWidth(60),
    height: getResponsiveWidth(60),
    marginBottom: getResponsiveHeight(8),
  },
  emotionText: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-Regular',
    color: '#333',
  },
  emotionTextSelected: {
    fontFamily: 'Pretendard-Bold',
    color: '#000',
  },
  confirmButton: {
    marginTop: 'auto',
    marginBottom: getResponsiveHeight(50),
    backgroundColor: '#FFC84D',
    paddingVertical: getResponsiveHeight(16),
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-Bold',
    color: 'white',
  },
});

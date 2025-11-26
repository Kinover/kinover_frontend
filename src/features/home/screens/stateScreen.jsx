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

  React.useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 100,
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
    outputRange: ['white', '#FFF5D1'],
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
      {/* 제목 */}
      <Text style={styles.title}>지금 나의 감정을 골라주세요</Text>

      {/* 부제목 */}
      <Text style={styles.subtitle}>
        {'선택한 감정은 24시간 동안 유지돼요.'}
      </Text>

      <FlatList
        data={EMOTIONS}
        renderItem={renderEmotion}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <BottomActionButton label="선택 완료" onPress={handleConfirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: getResponsiveHeight(45),
    paddingHorizontal: getResponsiveWidth(20),
    backgroundColor: '#F9F9F9',
  },

  /** 제목 스타일 (앱 전체 통일 버전) */
  title: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-SemiBold',
    color: 'black',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(6),
  },

  /** 부제목 스타일 */
  subtitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Light',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(25),
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
});

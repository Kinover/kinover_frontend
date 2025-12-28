/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */

// StateScreen.jsx (DropShadow per-item + No Clipping on Edges)
import React, {useRef, useMemo} from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
  Platform,
  Image,
} from 'react-native';

import DropShadow from 'react-native-drop-shadow';
import FastImage from '@d11/react-native-fast-image';

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

const CHECK_IMAGE = require('../../../assets/icons/check-gray.png');

const EMOTIONS = [
  {
    id: 'ANNOYED',
    label: '짜증나요',
    url: require('../../../assets/icons/state_v2/annoyed.png'),
  },
  {
    id: 'WORRIED',
    label: '걱정돼요',
    url: require('../../../assets/icons/state_v2/anxious.png'),
  },
  {
    id: 'DEPRESSED',
    label: '우울해요',
    url: require('../../../assets/icons/state_v2/depressed.png'),
  },
  {
    id: 'SORRY',
    label: '미안해요',
    url: require('../../../assets/icons/state_v2/sorry.png'),
  },
  {
    id: 'TIRED',
    label: '힘들어요',
    url: require('../../../assets/icons/state_v2/exhausted.png'),
  },
  {
    id: 'EXCITED',
    label: '신나요',
    url: require('../../../assets/icons/state_v2/excited.png'),
  },
  {
    id: 'NEUTRAL',
    label: '평범해요',
    url: require('../../../assets/icons/state_v2/neutral.png'),
  },
  {
    id: 'HAPPY',
    label: '행복해요',
    url: require('../../../assets/icons/state_v2/happy.png'),
  },
];

const CARD_H = getResponsiveHeight(115);
const RADIUS = 14;

// ✅ 그림자 잘림 방지용 “가장자리 여백”
const EDGE_GUTTER = getResponsiveWidth(6);
// ✅ 두 카드 사이 간격
const GAP = getResponsiveWidth(12);

const EmotionItem = ({item, index, isSelected, onPress, itemWidth}) => {
  const appear = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;
  const select = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const bgAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 360,
      delay: Math.min(index * 45, 260),
      useNativeDriver: true,
    }).start();
  }, [appear, index]);

  React.useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();

    Animated.timing(select, {
      toValue: isSelected ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isSelected, bgAnim, select]);

  const handlePressIn = () => {
    Animated.spring(press, {
      toValue: 1,
      friction: 7,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(press, {
      toValue: 0,
      friction: 7,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#FFF8E6'],
  });

  const borderColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#EEEEEE', '#FFC84D'],
  });

  const opacity = appear.interpolate({inputRange: [0, 1], outputRange: [0, 1]});
  const translateY = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  const pressScale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.985],
  });
  const selectScale = select.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });
  const scale = Animated.multiply(pressScale, selectScale);

  const badgeOpacity = select.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <TouchableWithoutFeedback
      onPress={() => onPress(item.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Animated.View
        style={{
          alignSelf: 'flex-start',
          opacity,
          transform: [{translateY}, {scale}],
        }}>
        <DropShadow
          style={[
            styles.shadow,
            {
              width: itemWidth,
              height: CARD_H,
              borderRadius: RADIUS,
            },
          ]}>
          <Animated.View
            style={[
              styles.emotionBox,
              {
                backgroundColor,
                borderColor,
              },
            ]}>
            {/* ✅ 기존 체크 텍스트 제거하고, 체크 이미지로 교체 + 흰색 tint */}
            <Animated.View style={[styles.checkBadge, {opacity: badgeOpacity}]}>
              <Image
                source={CHECK_IMAGE}
                style={styles.checkIcon}
                resizeMode="contain"
              />
            </Animated.View>

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

            <Animated.View
              pointerEvents="none"
              style={[
                styles.ring,
                {opacity: badgeOpacity, borderColor: '#FFC84D'},
              ]}
            />
          </Animated.View>
        </DropShadow>
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

  // ✅ “컨테이너 패딩 + 리스트 가장자리 여백(그림자용)”까지 반영해서 width 계산
  const itemWidth = useMemo(() => {
    const screenW = Dimensions.get('window').width;

    const containerPad = getResponsiveWidth(20) * 2; // container paddingHorizontal
    const listEdge = EDGE_GUTTER * 2; // ✅ 그림자 잘림 방지 여백
    const available = screenW - containerPad - listEdge - GAP;

    return Math.floor(available / 2);
  }, []);

  const handleConfirm = () => {
    if (!selectedEmotion) return;

    dispatch(
      modifyUserThunk({
        userId: user.userId,
        trait: user.trait,
        emotion: selectedEmotion,
      }),
    )
      .then(() => navigation.goBack())
      .catch(err => console.error('❌ 감정 저장 실패:', err));
  };

  const renderEmotion = ({item, index}) => (
    <EmotionItem
      item={item}
      index={index}
      itemWidth={itemWidth}
      isSelected={selectedEmotion === item.id}
      onPress={setSelectedEmotion}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>지금 나의 감정을 골라주세요</Text>
      <Text style={styles.subtitle}>
        {'선택한 감정은 24시간 동안 유지돼요.'}
      </Text>

      <FlatList
        scrollEnabled={false}
        data={EMOTIONS}
        renderItem={renderEmotion}
        keyExtractor={item => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
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

  title: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-SemiBold',
    color: 'black',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(6),
  },

  subtitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Light',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(25),
  },

  listContent: {
    paddingTop: getResponsiveHeight(5),
    paddingBottom: getResponsiveHeight(30),

    // ✅ 여기! 그림자 잘림 방지용 리스트 좌우 여백
    paddingHorizontal: EDGE_GUTTER,
  },

  row: {
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(14),
  },

  shadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 5,
    ...(Platform.OS === 'android' ? {elevation: 4} : null),
  },

  emotionBox: {
    width: '100%',
    height: CARD_H,
    borderRadius: RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.2,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },

  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS,
    borderWidth: 2,
    opacity: 0,
  },

  checkBadge: {
    position: 'absolute',
    top: getResponsiveHeight(8),
    right: getResponsiveWidth(8),
    width: getResponsiveWidth(22),
    height: getResponsiveWidth(22),
    borderRadius: 999,
    backgroundColor: '#FFC84D', // ✅ 노란 배경 그대로
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ✅ 체크 아이콘 (회색 png → 흰색 tint)
  checkIcon: {
    width: getResponsiveWidth(11),
    height: getResponsiveWidth(11),
    tintColor: '#FFFFFF',
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

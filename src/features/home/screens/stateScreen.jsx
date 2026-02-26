/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */

import React, {useRef, useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Image,
} from 'react-native';

import DropShadow from 'react-native-drop-shadow';
import FastImage from '@d11/react-native-fast-image';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';
import useHideTabBar from 'hooks/useHideTabBar';
import {modifyUserThunk} from '../store/userThunk';
import BottomActionButton from 'components/BottomActionButton';

// Android 3버튼 네비게이션 바 높이 대략값 (insets.bottom이 0일 때 대비)
const ANDROID_NAV_BAR_FALLBACK = 48;

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

const CARD_H_DEFAULT = getResponsiveHeight(115);
const RADIUS = 14;

// 그림자 잘림 방지용 “가장자리 여백”
const EDGE_GUTTER = getResponsiveWidth(6);
// 두 카드 사이 가로 간격
const GAP = getResponsiveWidth(12);
// 행 사이 세로 간격 (카드 위아래)
const ROW_GAP = getResponsiveHeight(12);

// ==================== Components ====================

/**
 * 감정 카드 아이템 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {Object} props.item - 감정 데이터 객체
 * @param {string} props.item.id - 감정 ID
 * @param {string} props.item.label - 감정 라벨
 * @param {number} props.item.url - 이미지 리소스
 * @param {number} props.index - 아이템 인덱스
 * @param {boolean} props.isSelected - 선택 여부
 * @param {Function} props.onPress - 클릭 핸들러
 * @param {number} props.itemWidth - 아이템 너비
 * @param {number} [props.cardHeight] - 카드 높이 (미주입 시 CARD_H_DEFAULT)
 */
const EmotionItem = ({
  item,
  index,
  isSelected,
  onPress,
  itemWidth,
  cardHeight,
}) => {
  const cardH = cardHeight ?? CARD_H_DEFAULT;
  const appear = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;
  const select = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const bgAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

 // 등장 애니메이션
  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 360,
      delay: Math.min(index * 45, 260),
      useNativeDriver: true,
    }).start();
  }, [appear, index]);

  useEffect(() => {
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
            {width: itemWidth, height: cardH, borderRadius: RADIUS},
          ]}>
          <Animated.View
            style={[
              styles.emotionBox,
              {backgroundColor, borderColor, height: cardH},
            ]}>
            <Image
              source={item.url}
              style={styles.emotionImage}
              resizeMode={FastImage.resizeMode.contain}
            />

            <Text
              allowFontScaling={false}
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

// ==================== Main Component ====================

/**
 * 감정 선택 화면 메인 컴포넌트
 * @returns {JSX.Element} 감정 선택 화면
 */
export default function StateScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const [selectedEmotion, setSelectedEmotion] = useState(
    user.emotion || 'NEUTRAL',
  );

 // 하단 탭바 숨김
  useHideTabBar();

 // 카드 너비 계산 (2열 그리드)
  const itemWidth = useMemo(() => {
    const screenW = Dimensions.get('window').width;
    const containerPad = getResponsiveWidth(20) * 2;
    const listEdge = EDGE_GUTTER * 2;
    const available = screenW - containerPad - listEdge - GAP;
    return Math.floor(available / 2);
  }, []);

 // 그리드 영역 높이 측정 → 4행으로 나눠 카드 높이 계산
  const [contentHeight, setContentHeight] = useState(0);
  const rowHeight =
    contentHeight > 0 ? (contentHeight - ROW_GAP * 3) / 4 : CARD_H_DEFAULT;
  const cardHeight = Math.max(getResponsiveHeight(80), rowHeight - ROW_GAP);

 // Android 3버튼 네비게이션 바: insets.bottom이 0이면 fallback 적용
  const bottomSafe = useMemo(() => {
    const base =
      Platform.OS === 'android'
        ? Math.max(insets.bottom, getResponsiveHeight(ANDROID_NAV_BAR_FALLBACK))
        : insets.bottom;
    return base + getResponsiveHeight(16);
  }, [insets.bottom]);

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

 // 8개 감정을 2열×4행으로 나눔
  const rows = useMemo(() => {
    const list = [...EMOTIONS];
    const result = [];
    for (let i = 0; i < 4; i++) {
      result.push(list.slice(i * 2, i * 2 + 2));
    }
    return result;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          지금 나의 감정을 골라주세요
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          선택한 감정은 24시간 동안 유지돼요.
        </Text>
      </View>

      <View
        style={styles.gridWrap}
        onLayout={e => {
          const h = e?.nativeEvent?.layout?.height;
          if (typeof h === 'number' && h > 0) setContentHeight(h);
        }}>
        {rows.map((rowItems, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {rowItems.map((item, colIndex) => (
              <EmotionItem
                key={item.id}
                item={item}
                index={rowIndex * 2 + colIndex}
                itemWidth={itemWidth}
                cardHeight={cardHeight}
                isSelected={selectedEmotion === item.id}
                onPress={setSelectedEmotion}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={[styles.footer, {paddingBottom: bottomSafe}]}>
        <BottomActionButton
          variant="fixed"
          label="선택 완료"
          onPress={handleConfirm}
        />
      </View>
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

  header: {
    paddingHorizontal: EDGE_GUTTER,
    marginBottom: getResponsiveHeight(16),
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
  },

  gridWrap: {
    flex: 1,
    paddingHorizontal: EDGE_GUTTER,
    justifyContent: 'flex-start',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ROW_GAP,
  },

  shadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    ...(Platform.OS === 'android' ? {elevation: 4} : null),
  },

  footer: {
    paddingTop: getResponsiveHeight(16),
    paddingHorizontal: EDGE_GUTTER,
    minHeight: getResponsiveHeight(50) + getResponsiveHeight(16),
  },

  emotionBox: {
    width: '100%',
    borderRadius: RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.1,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },

  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS,
    borderWidth: 1,
    opacity: 0,
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

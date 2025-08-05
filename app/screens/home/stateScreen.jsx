import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../utils/responsive';
import useHideTabBar from '../../hooks/useHideTabBar';
import {useDispatch, useSelector} from 'react-redux';
import {modifyUserThunk} from '../../redux/thunk/userThunk';
import {useNavigation} from '@react-navigation/native'; // 이미 있을 수도 있어

const EMOTIONS = [
  {
    id: 'ANNOYED',
    label: '짜증나요',
    url: require('../../assets/icons/state/annoyed.png'),
  },
  {
    id: 'WORRIED',
    label: '걱정돼요',
    url: require('../../assets/icons/state/anxious.png'),
  },
  {
    id: 'DEPRESSED',
    label: '우울해요',
    url: require('../../assets/icons/state/depressed.png'),
  },
  {
    id: 'SORRY',
    label: '미안해요',
    url: require('../../assets/icons/state/sorry.png'),
  },
  {
    id: 'TIRED',
    label: '힘들어요',
    url: require('../../assets/icons/state/exhausted.png'),
  },
  {
    id: 'EXCITED',
    label: '신나요',
    url: require('../../assets/icons/state/excited.png'),
  },
  {
    id: 'NEUTRAL',
    label: '평범해요',
    url: require('../../assets/icons/state/neutral.png'),
  },
  {
    id: 'HAPPY',
    label: '행복해요',
    url: require('../../assets/icons/state/happy.png'),
  },
];

const EmotionItem = ({item, isSelected, onPress}) => (
  <TouchableOpacity
    onPress={() => onPress(item.id)}
    style={[styles.emotionBox, isSelected && styles.emotionBoxSelected]}>
    <Image source={item.url} style={styles.emotionImage} resizeMode="contain" />
    <Text
      style={[styles.emotionText, isSelected && styles.emotionTextSelected]}>
      {item.label}
    </Text>
  </TouchableOpacity>
);

export default function StateScreen() {
  const navigation = useNavigation(); // ✅ 추가
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const userId = user.userId;
  const [selectedEmotion, setSelectedEmotion] = useState(
    user.emotion || 'neutral',
  );

  useHideTabBar();

  const handleSelectEmotion = emotion => {
    setSelectedEmotion(emotion);
  };

  const handleConfirm = () => {
    if (selectedEmotion) {
      dispatch(modifyUserThunk({userId: user.userId, emotion: selectedEmotion}))
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
        onPress={handleSelectEmotion}
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
      />
      <TouchableOpacity
        style={[
          styles.confirmButton,
          !selectedEmotion && {backgroundColor: '#ccc'},
        ]}
        disabled={!selectedEmotion}
        onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>선택완료</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: getResponsiveHeight(50),
    paddingHorizontal: getResponsiveWidth(20),
    backgroundColor: '#F9F9F9',
    alignContent: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: getResponsiveFontSize(21),
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
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    shadowOffset: {width: 0, height: 1},
    shadowColor: 'gray',
    shadowRadius: 1,
    shadowOpacity: 0.3,
    marginHorizontal: 10,
  },
  emotionImage: {
    width: getResponsiveWidth(60),
    height: getResponsiveWidth(60),
    marginBottom: getResponsiveHeight(6),
  },
  emotionBoxSelected: {
    backgroundColor: '#FFF5D1',
    borderColor: '#FFC84D',
    borderWidth: 1.5,
  },
  emotionText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
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
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-Bold',
    color: '#000',
  },
});


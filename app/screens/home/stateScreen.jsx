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

const EMOTIONS = [
  {
    id: 'annoyed',
    label: '짜증나요',
    url: require('../../assets/icons/state/annoyed.png'),
  },
  {
    id: 'anxious',
    label: '걱정돼요',
    url: require('../../assets/icons/state/anxious.png'),
  },
  {
    id: 'depressed',
    label: '우울해요',
    url: require('../../assets/icons/state/depressed.png'),
  },
  {
    id: 'sorry',
    label: '미안해요',
    url: require('../../assets/icons/state/sorry.png'),
  },
  {
    id: 'exhausted',
    label: '힘들어요',
    url: require('../../assets/icons/state/exhausted.png'),
  },
  {
    id: 'excited',
    label: '신나요',
    url: require('../../assets/icons/state/excited.png'),
  },
  {
    id: 'neutral',
    label: '평범해요',
    url: require('../../assets/icons/state/neutral.png'),
  },
  {
    id: 'happy',
    label: '행복해요',
    url: require('../../assets/icons/state/happy.png'),
  },
];

export default function StateScreen() {
  const [selectedEmotion, setSelectedEmotion] = useState(null);

  useHideTabBar();

  const renderEmotion = ({item}) => {
    const isSelected = selectedEmotion === item.id;
    return (
      <TouchableOpacity
        onPress={() => setSelectedEmotion(item.id)}
        style={[styles.emotionBox, isSelected && styles.emotionBoxSelected]}>
        <Image
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
      </TouchableOpacity>
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
        onPress={() => {
          console.log('선택된 감정:', selectedEmotion);
          // 다음 로직 처리 (예: 서버 전송, 다음 화면 이동 등)
        }}>
        <Text style={styles.confirmButtonText}>선택완료</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: getResponsiveHeight(40),
    paddingHorizontal: getResponsiveWidth(24),
    backgroundColor: '#F9F9F9',
  },
  title: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-Medium',
    marginBottom: getResponsiveHeight(24),
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
    height: getResponsiveHeight(100),
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
    paddingVertical: getResponsiveHeight(14),
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    color: '#000',
  },
});

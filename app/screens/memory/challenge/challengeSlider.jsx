// ChallengeSlider 컴포넌트
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator } from 'react-native';
import CardSlider from './cardSlider';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRecChallengeThunk } from '../../../redux/thunk/recChallengeThunk';

export default function ChallengeSlider() {
  const family = useSelector(state => state.family); // Redux 상태에서 family 데이터 가져오기
  const {recChallengeList, loading } = useSelector(state => state.recChallenge); // Redux 상태에서 recChallengeList 가져오기
  const dispatch = useDispatch();

  useEffect(() => {
    if (loading) return;  // ✅ 로딩 중이면 실행 안 함

   else if (recChallengeList.length === 0) {
      console.log('Dispatching fetchRecChallenge...');
      dispatch(fetchRecChallengeThunk());
    }
  }, [recChallengeList, loading, dispatch]); 


  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://i.postimg.cc/MGjRJXwD/Rectangle-1.jpg' }}
        style={styles.icon}
      />

      <View style={styles.header}>
        <Text style={styles.familyName}>{family.name}</Text>
        <Text> {" 패밀리를 위한 추천 미션이에요."}</Text>
      </View>

      {/* 로딩 중일 경우 로딩 표시 */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        // recChallengeList가 배열이고 데이터가 있을 때만 CardSlider 렌더링
        Array.isArray(recChallengeList) && recChallengeList.length > 0 ? (
          <CardSlider data={recChallengeList} />
        ) : (
          <Text>No data available</Text> // 데이터가 없을 경우 메시지 표시
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: getResponsiveHeight(50),
  },
  icon: {
    width: getResponsiveIconSize(40),
    height: getResponsiveIconSize(40),
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: getResponsiveHeight(50),
  },
  familyName: {
    fontWeight: '900',
    fontSize: getResponsiveFontSize(25),
  },
});

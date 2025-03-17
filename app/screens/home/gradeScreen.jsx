import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import {useSelector} from 'react-redux';

const relationshipMessages = {
  '어색한 사이':
    '처음 만났을 때,\n모든 게 낯설고 서먹한 시기입니다.\n\n서로에 대해 잘 모르지만,\n한 발짝씩 다가가고 있는 중이에요 🙂',
  '알아가는 사이':
    '서로에 대해 알아가는 중입니다.\n아직은 조금 어색하지만,\n\n 작은 대화와 행동을 통해\n조금씩 가까워지고 있답니다 😉',
  '다가가는 사이':
    '서로를 조금 더 \n편하게 느끼기 시작했어요.\n\n신뢰를 쌓고, 조금씩 마음의\n거리가 좁혀지는 단계입니다 😀',
  '편안한 사이':
    '이제 서로가 편안함을 느끼고,\n함께 있는 것이 자연스러워졌어요.\n\n서로의 존재가 부담 없이\n받아들여지는 시기랍니다 😆',
  '진심을 나누는 사이':
    '서로의 진심을 나누고,\n마음 깊은 곳까지\n이해하는 사이입니다.\n\n감정과 생각을 솔직하게 \n공유할 수 있는 관계예요 🤭',
  '단단한 사이':
    '서로가 든든한\n버팀목이 되어 주는 관계입니다.\n\n어려움도 함께 이겨내고,\n변함없이 강한 유대감을\n느낄 수 있어요 😊',
  '믿음의 사이':
    '신뢰를 바탕으로\n모든 걸 함께 나누는 사이입니다.\n\n서로를 믿고 의지할 수 있는\n강한 관계로,\n\n어떤 상황에서도 함께할 수 있어요!',
  '하나된 사이':
    '서로의 마음이 완전히 일치하며\n하나가 된 관계입니다.\n\n모든 것을 함께하며,\n깊은 사랑과 유대감을 느낄 수 있는\n완벽한 조화의 시기입니다 -🩷',
};

export default function GradeScreen() {
  const family = useSelector(state => state.family);
  const message =
    relationshipMessages[family.relationship] || '관계를 정의할 수 없습니다.';

  return (
    <View style={styles.container}>
      <Image
        style={styles.lightImage}
        source={{
          uri: 'https://i.postimg.cc/SxCzvb81/Group-1171276561.png',
        }}></Image>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{family.name}</Text>
        <Text style={styles.headerSubTitle}>
          패밀리님은
          <Text style={styles.headerSubTitlePoint}>
            {` '${family.relationship}' `}
          </Text>
          예요!
        </Text>
      </View>
      <View style={styles.mainContainer}>
        {/* <Text style={styles.mainContainerText}>{message}</Text> */}
        <Text style={styles.mainContainerText}>{message}</Text>

        <View style={styles.barContainer}>
          <View style={styles.bar}>
            <View style={styles.progress}></View>
            <Image
              style={styles.kinoImage}
              source={{
                uri: 'https://i.postimg.cc/1zbHnn2C/Group-1171276563-1.png',
              }}
            />
            <Image
              style={styles.kinoImage2}
              source={{
                uri: 'https://i.postimg.cc/gJRKvcPY/Group-1171276564-1.png',
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    // paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(30),
    alignItems: 'center',
    gap: getResponsiveHeight(30),
  },
  header: {
    alignItems: 'center',
    gap: getResponsiveHeight(10),
  },
  lightImage: {
    width: getResponsiveWidth(35),
    height: getResponsiveHeight(97),
  },
  headerTitle: {
    fontFamily: 'Pretendard-Bold',
    fontSize: getResponsiveFontSize(33),
  },
  headerSubTitle: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(22),
  },
  headerSubTitlePoint: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(25),
  },
  mainContainer: {
    alignItems: 'center',
    gap: getResponsiveHeight(90),
  },
  mainContainerText: {
    fontSize: getResponsiveFontSize(20),
    maxWidth: getResponsiveWidth(290),
    color: '#525252',
    textAlign: 'center',
    fontFamily: 'Pretendard-Light',
  },

  barContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: getResponsiveWidth(280),
    position: 'relative', // 바가 기준이 됨
  },

  bar: {
    width: getResponsiveWidth(280),
    height: getResponsiveHeight(25),
    borderRadius: getResponsiveIconSize(40),
    backgroundColor: 'lightgray',
    position: 'relative',
  },

  progress: {
    width: getResponsiveWidth(230),
    height: getResponsiveHeight(25),
    borderRadius: getResponsiveIconSize(40),
    backgroundColor: 'lightpink',
    position: 'absolute',
  },

  kinoImage: {
    position: 'absolute',
    bottom: getResponsiveHeight(23), // 바 위로 올리기
    left: getResponsiveWidth(200), // 왼쪽 배치
    width: getResponsiveWidth(31),
    height: getResponsiveHeight(40),
  },

  kinoImage2: {
    position: 'absolute',
    bottom: getResponsiveHeight(23), // 바 위로 올리기
    right: getResponsiveWidth(-30), // 오른쪽 배치
    width: getResponsiveWidth(59),
    height: getResponsiveHeight(64),
  },
});

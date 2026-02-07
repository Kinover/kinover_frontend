// utils/emotionUtils.js
export function getEmotionImage(emotion) {
  switch (emotion) {
    case 'ANNOYED':
      return require('../../../assets/state4/1.png');
    case 'WORRIED':
      return require('../../../assets/state4/2.png');
    case 'DEPRESSED':
      return require('../../../assets/state4/5.png');
    case 'SORRY':
      return require('../../../assets/state4/6.png');
    case 'TIRED':
      return require('../../../assets/state4/3.png');
    case 'NEUTRAL':
      return require('../../../assets/state4/8.png');
    case 'HAPPY':
      return require('../../../assets/state4/7.png');
    case 'EXCITED':
      return require('../../../assets/state4/4.png');
    default:
      return require('../../../assets/state4/6.png');
  }
}

/**
 * ✅ 감정(Emotion) → 대표 컬러
 * - 테두리(ring) / 포인트 컬러로 사용
 * - 프로젝트 감정 enum이 이미 대문자라 그대로 매핑하면 됨
 *
 * 사용 예)
 * const ringColor = getEmotionColor(finalEmotion) || '#EEF2F7';
 */
export function getEmotionColor(emotion) {
  switch (emotion) {
    case 'HAPPY':
      return '#FF96C5'; // 따뜻한 노랑/주황

    case 'EXCITED':
      return '#FFC84D'; // 더 쨍한 오렌지

    case 'NEUTRAL':
      return '#8B8B8B'; // 중립 그레이(쿨)

    case 'TIRED':
      return '#A97EFF'; // 퍼플(불안/걱정)

    case 'DEPRESSED':
      return '#57A0FF'; // 블루(다운)

    case 'WORRIED':
      return '#639A66'; // 조금 더 무거운 그레이

    case 'ANNOYED':
      return '#F03F37'; // 레드(짜증/화)

    case 'SORRY':
      return '#FF9335'; // 핑크(미안/사과)

    default:
      return null; // 감정 없거나 모르면 기본색 쓰기
  }
}

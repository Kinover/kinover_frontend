/**
 * @fileoverview 감정(Emotion) 관련 유틸리티
 * 
 * 감정 enum에 따른 이미지 및 색상 매핑을 제공합니다.
 */

// ==================== Constants ====================

/** 감정 유효 기간 (24시간) */
const EMOTION_EXPIRE_MS = 24 * 60 * 60 * 1000;

/** 감정 이벤트 ID (앱 알림에서 감정 선택 모달 숨김 조건용) */
export const EMOTION_PICK_EVENT_ID = 'emotion_pick_today_2026_01';

/**
 * 감정이 유효한지 확인 (24시간 이내 선택한 감정인지)
 * @param {string|null} emotion - 감정 코드
 * @param {string|number|null} emotionUpdatedAt - 감정 선택 시각
 * @returns {boolean}
 */
export function isEmotionValid(emotion, emotionUpdatedAt) {
  if (!emotion || !emotionUpdatedAt) return false;
  const t = new Date(emotionUpdatedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= EMOTION_EXPIRE_MS;
}

/** 감정 타입 정의 */
const EMOTION_TYPES = {
  ANNOYED: 'ANNOYED',
  WORRIED: 'WORRIED',
  DEPRESSED: 'DEPRESSED',
  SORRY: 'SORRY',
  TIRED: 'TIRED',
  NEUTRAL: 'NEUTRAL',
  HAPPY: 'HAPPY',
  EXCITED: 'EXCITED',
};

// ==================== Public API ====================

/**
 * 감정에 해당하는 이미지 리소스 반환
 * @param {string} emotion - 감정 타입 (대문자)
 * @returns {number} require()로 로드된 이미지 리소스
 * 
 * @example
 * const image = getEmotionImage('HAPPY');
 * <Image source={image} />
 */
export function getEmotionImage(emotion) {
  switch (emotion) {
    case EMOTION_TYPES.ANNOYED:
      return require('../../../assets/state4/1.png');
    case EMOTION_TYPES.WORRIED:
      return require('../../../assets/state4/2.png');
    case EMOTION_TYPES.DEPRESSED:
      return require('../../../assets/state4/5.png');
    case EMOTION_TYPES.SORRY:
      return require('../../../assets/state4/6.png');
    case EMOTION_TYPES.TIRED:
      return require('../../../assets/state4/3.png');
    case EMOTION_TYPES.NEUTRAL:
      return require('../../../assets/state4/8.png');
    case EMOTION_TYPES.HAPPY:
      return require('../../../assets/state4/7.png');
    case EMOTION_TYPES.EXCITED:
      return require('../../../assets/state4/4.png');
    default:
      return require('../../../assets/state4/6.png'); // 기본값: SORRY
  }
}

/**
 * 감정에 해당하는 대표 컬러 반환
 * 테두리(ring) 또는 포인트 컬러로 사용됩니다.
 * 
 * @param {string} emotion - 감정 타입 (대문자)
 * @returns {string|null} HEX 컬러 코드 또는 null
 * 
 * @example
 * const ringColor = getEmotionColor('HAPPY') || '#EEF2F7';
 * <View style={{ borderColor: ringColor }} />
 */
export function getEmotionColor(emotion) {
  switch (emotion) {
    case EMOTION_TYPES.HAPPY:
      return '#FF96C5'; // 따뜻한 핑크

    case EMOTION_TYPES.EXCITED:
      return '#FFC84D'; // 밝은 오렌지

    case EMOTION_TYPES.NEUTRAL:
      return '#8B8B8B'; // 중립 그레이

    case EMOTION_TYPES.TIRED:
      return '#A97EFF'; // 퍼플

    case EMOTION_TYPES.DEPRESSED:
      return '#57A0FF'; // 블루

    case EMOTION_TYPES.WORRIED:
      return '#639A66'; // 그린 그레이

    case EMOTION_TYPES.ANNOYED:
      return '#F03F37'; // 레드

    case EMOTION_TYPES.SORRY:
      return '#FF9335'; // 오렌지 핑크

    default:
      return null; // 감정 없거나 알 수 없으면 null
  }
}

/**
 * @fileoverview 감정(Emotion) 관련 유틸리티
 * 
 * 감정 enum에 따른 이미지 및 색상 매핑을 제공합니다.
 */

/** 감정 이벤트 ID (앱 알림에서 감정 선택 모달 숨김 조건용) */
export const EMOTION_PICK_EVENT_ID = 'emotion_pick_today_2026_01';

/**
 * 감정이 유효한지 확인
 * 백엔드에서 24시간 경과 시 emotion=null을 내려주므로,
 * 프론트는 값 존재 여부만 확인한다.
 * @param {string|null} emotion - 감정 코드
 * @param {string|number|null} emotionUpdatedAt - 호환용(미사용)
 * @returns {boolean}
 */
export function isEmotionValid(emotion, emotionUpdatedAt) {
  return !!emotion;
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

/** 프로필/그리드 오버레이용 `state4` (감정 선택 카드 `state_v2`와 별도) */
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
      return require('../../../assets/state4/6.png');
  }
}

/** 감정 선택 화면과 동일 이미지 (`state_v2`) — 홈 기분 뱃지 등 */
export function getEmotionPickerImage(emotion) {
  switch (emotion) {
    case EMOTION_TYPES.ANNOYED:
      return require('../../../assets/icons/state_v2/annoyed.png');
    case EMOTION_TYPES.WORRIED:
      return require('../../../assets/icons/state_v2/anxious.png');
    case EMOTION_TYPES.DEPRESSED:
      return require('../../../assets/icons/state_v2/depressed.png');
    case EMOTION_TYPES.SORRY:
      return require('../../../assets/icons/state_v2/sorry.png');
    case EMOTION_TYPES.TIRED:
      return require('../../../assets/icons/state_v2/exhausted.png');
    case EMOTION_TYPES.NEUTRAL:
      return require('../../../assets/icons/state_v2/neutral.png');
    case EMOTION_TYPES.HAPPY:
      return require('../../../assets/icons/state_v2/happy.png');
    case EMOTION_TYPES.EXCITED:
      return require('../../../assets/icons/state_v2/excited.png');
    default:
      return require('../../../assets/icons/state_v2/neutral.png');
  }
}

/**
 * 감정에 해당하는 한국어 텍스트 반환 — 말풍선 등에 사용
 * @param {string|null} emotion
 * @returns {string|null}
 */
export function getEmotionLabel(emotion) {
  if (!emotion) return null;
  switch (String(emotion).toUpperCase()) {
    case 'ANNOYED':   return '짜증나요 😤';
    case 'WORRIED':   return '걱정돼요 😟';
    case 'DEPRESSED': return '우울해요 😔';
    case 'SORRY':     return '미안해요 🥺';
    case 'TIRED':     return '힘들어요 😴';
    case 'NEUTRAL':   return '평범해요 😐';
    case 'HAPPY':     return '행복해요 😊';
    case 'EXCITED':   return '신나요 🎉';
    default:          return null;
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

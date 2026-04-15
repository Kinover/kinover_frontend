// src/config/appEvents.js

import {
  getResponsiveWidth,
  getResponsiveHeight,
} from 'utils/responsive';

export const EMOTION_PICK_APP_EVENT_ID = 'emotion_pick_today_2026_01';

const EMOTION_POPUP_ICON = 92;
/** 가운데보다 작은 좌·우 감정 아이콘(디자인 상수) */
const EMOTION_POPUP_FLANK_ICON = 60;

export const APP_EVENTS = [
  {
    id: 'home_event_2026_01',
    enabled: false,
    priority: 100,
    title: '키노버 새 소식',
    message: '가족 초대 기능이 업데이트 되었어요!\n지금 확인해볼까요?',
    startAt: null,
    endAt: null,

 // 예시: 원격 이미지
    imageUri: 'https://your-cdn.com/kinover/event_invite.png',

    primary: {
      text: '보러가기',
      action: {kind: 'navigate', target: 'FamilySettingScreen', params: {}},
    },
    secondaryText: '오늘 하루 보지 않기',
    tertiaryText: '다시 보지 않기',
  },

  {
    id: EMOTION_PICK_APP_EVENT_ID,
    enabled: false,
    priority: 120,
    title: '오늘의 감정, 공유해볼까요?',
    subTitle: '가족들과 오늘의 감정을 공유해보세요.',
    message: '',

    image: {
      source: require('../assets/icons/state_v2/excited.png'),
      width: getResponsiveWidth(EMOTION_POPUP_ICON),
      height: getResponsiveHeight(EMOTION_POPUP_ICON),
      resizeMode: 'contain',
    },
    imageFlank: {
      left: require('../assets/icons/state_v2/happy.png'),
      right: require('../assets/icons/state_v2/depressed.png'),
      iconSize: EMOTION_POPUP_FLANK_ICON,
    },

    startAt: null,
    endAt: null,

    primary: {
      text: '감정 선택하기',
      action: {
        kind: 'navigate',
        target: '감정상태화면',
        params: {from: 'home_event'},
      },
    },
    secondaryText: '오늘 하루 보지 않기',
    tertiaryText: '다시 보지 않기',
  },
];

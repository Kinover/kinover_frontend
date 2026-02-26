// src/config/appEvents.js

export const APP_EVENTS = [
  {
    id: 'home_event_2026_01',
    enabled: true,
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
    id: 'emotion_pick_today_2026_01',
    enabled: true,
    priority: 120,
    title: '오늘의 감정, 공유해볼까요?',
    subTitle: '가족들과 오늘의 감정을 공유해보세요.',
    message: '',

 // 예시: 로컬 정적 이미지 (프로젝트 경로에 맞게 수정)
 // image: require('../assets/images/emotionPopup.png'),
 // 또는 원격이면:
 // imageUri: "https~..",
    image: require('../assets/modal/emotion.png'),

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

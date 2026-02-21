/**
 * 앱스토어 스크린샷용 더미 데이터 (캡처 후 삭제)
 * 사용 후 STORE_MOCK_ENABLED = false 로 바꾸거나 이 파일을 제거하세요.
 */

import {Image} from 'react-native';

export const STORE_MOCK_ENABLED = false;

// 1-엄마 2-아빠 3-둘째 4-첫째(나) 5-셋째
const getAssetUri = module => Image.resolveAssetSource(module)?.uri ?? null;
const PROFILE_1 = getAssetUri(require('../../../assets/dummy/profile1.jpg'));
const PROFILE_2 = getAssetUri(require('../../../assets/dummy/profile2.jpg'));
const PROFILE_3 = getAssetUri(require('../../../assets/dummy/profile3.jpg'));
const PROFILE_4 = getAssetUri(require('../../../assets/dummy/profile4.jpg'));
const PROFILE_5 = getAssetUri(require('../../../assets/dummy/profile5.jpg'));
const POST1_1 = getAssetUri(require('../../../assets/dummy/post1-1.jpg'));
const POST3_1 = getAssetUri(require('../../../assets/dummy/post3-1.jpg'));
const GRADUATE = getAssetUri(require('../../../assets/dummy/graduate.jpg'));
const KINO_YELLOW = getAssetUri(
  require('../../../assets/images/kino-yellow.png'),
);

const now = Date.now();
const tenMinutesAgo = new Date(now - 10 * 60 * 1000).toISOString();
const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();

/** 헤더용 현재 유저 (첫째) */
export function getStoreMockUser() {
  return {
    userId: 'mock-first',
    name: '첫째',
    trait: '꼼꼼하게 일정 챙기는 걸 좋아해요',
    emotion: 'HAPPY',
    emotionUpdatedAt: new Date(now - 30 * 60 * 1000).toISOString(),
    image: PROFILE_4,
    birth: null,
    familyId: 'mock-family',
  };
}

/** 그리드에 보일 가족 4명 (엄마, 아빠, 둘째, 셋째) */
export function getStoreMockFamilyMembers() {
  return [
    {
      userId: 'mock-mom',
      name: '엄마',
      trait: '항상 우리 편이 되어주는 든든한 사람',
      emotion: 'HAPPY',
      emotionUpdatedAt: twoHoursAgo,
      image: PROFILE_1,
      birth: '1985-02-26', // 엄마 생신 26일
    },
    {
      userId: 'mock-dad',
      name: '아빠',
      trait: '말없이 곁에서 지켜주는 사람',
      emotion: 'NEUTRAL',
      emotionUpdatedAt: yesterday,
      image: PROFILE_2,
      birth: null,
    },
    {
      userId: 'mock-second',
      name: '둘째',
      trait: '어려울 때 먼저 손 내미는 사람',
      emotion: 'EXCITED',
      emotionUpdatedAt: twoHoursAgo,
      image: PROFILE_3,
      birth: null,
    },
    {
      userId: 'mock-third',
      name: '셋째',
      trait: '장난끼 가득한 우리 집 분위기 메이커',
      emotion: null,
      emotionUpdatedAt: null,
      image: PROFILE_5,
      birth: null,
    },
  ];
}

/** 온라인 1명 (엄마) */
export function getStoreMockOnlineUserIds() {
  return ['mock-mom'];
}

/** 나머지: 10분 전, 2시간 전(오늘 오전), 어제 */
export function getStoreMockLastActiveMap() {
  return {
    'mock-mom': null,
    'mock-dad': yesterday,
    'mock-second': twoHoursAgo,
    'mock-third': tenMinutesAgo,
  };
}

// ---------- 일정 화면용 ----------

/** 일정 화면에서 쓸 가족 전체 리스트 (첫째+엄마+아빠+둘째+셋째) */
export function getStoreMockFamilyUserListForSchedule() {
  return [getStoreMockUser(), ...getStoreMockFamilyMembers()];
}

const pad2 = n => String(n).padStart(2, '0');

/** 날짜별 일정 더미: 가족만 있는 날, 개인만 있는 날, 둘 다 있는 날, 없는 날 섞어서 */
export function getStoreMockScheduleList(dateYMD) {
  const familyId = 'mock-family';
  const day = dateYMD ? parseInt(String(dateYMD).slice(-2), 10) : 0;

  const familyOnly = [
    {
      scheduleId: 80001,
      id: 80001,
      familyId,
      date: dateYMD,
      title: '가족 외식',
      type: 'FAMILY',
      participantIds: [
        'mock-mom',
        'mock-dad',
        'mock-first',
        'mock-second',
        'mock-third',
      ],
      memo: '',
      __forcedKind: 'FAMILY',
    },
  ];
  const individualOnly = [
    {
      scheduleId: 80002,
      id: 80002,
      familyId,
      date: dateYMD,
      title: '병원 예약',
      type: 'INDIVIDUAL',
      participantIds: ['mock-mom'],
      memo: '',
      __forcedKind: 'INDIVIDUAL',
    },
    {
      scheduleId: 80003,
      id: 80003,
      familyId,
      date: dateYMD,
      title: 'PT 수업',
      type: 'INDIVIDUAL',
      participantIds: ['mock-dad'],
      memo: '',
      __forcedKind: 'INDIVIDUAL',
    },
  ];

  if ([7, 24].includes(day)) return familyOnly;
  if (day === 26) {
    return [
      {
        scheduleId: 80010,
        id: 80010,
        familyId,
        date: dateYMD,
        title: '엄마 생신 기념 외식 🍽️',
        type: 'FAMILY',
        participantIds: [
          'mock-mom',
          'mock-dad',
          'mock-first',
          'mock-second',
          'mock-third',
        ],
        memo: '엄마 생신 26일',
        __forcedKind: 'FAMILY',
      },
    ];
  }
  if ([3, 12, 18].includes(day)) return individualOnly;
  if ([15, 28].includes(day)) return [...familyOnly, ...individualOnly];
  return [];
}

/** 달력 날짜별 일정 개수 더미 (가족만 / 개인만 / 둘 다 / 없는 날 구분) */
export function getStoreMockScheduleCountPerDay(year, month) {
  const map = {};
  const m = pad2(month);
  const familyOnlyDays = [7, 24, 26];
  const individualOnlyDays = [3, 12, 18];
  const bothDays = [15, 28];

  [...familyOnlyDays, ...individualOnlyDays, ...bothDays].forEach(day => {
    const key = `${year}-${m}-${pad2(day)}`;
    if (familyOnlyDays.includes(day)) {
      map[key] = {total: 1, family: 1};
    } else if (individualOnlyDays.includes(day)) {
      map[key] = {total: 2, individual: 2};
    } else {
      map[key] = {total: 2, family: 1, individual: 1};
    }
  });
  return map;
}

// ---------- 키노상담소 채팅 더미 ----------

/**
 * 키노상담소 채팅 메시지 더미 (DESC: 최신 first)
 * @param {string} currentUserId - 내 userId (보낸 메시지 senderId에 사용)
 */
export function getStoreMockKinoMessages(currentUserId) {
  const today = new Date();
  const y = today.getFullYear();
  const m = '02';
  const d = '20';
  const t4_17 = `${y}-${m}-${d}T16:17:00.000`;
  const t4_15 = `${y}-${m}-${d}T16:15:00.000`;
  const t4_14 = `${y}-${m}-${d}T16:14:00.000`;

  const me = currentUserId || 'mock-first';
  const kino = 'kino';

  return [
    {
      messageId: 'mock-kino-5',
      senderId: kino,
      content:
        '오! 건강 신경 쓰시는 엄마라면 엄청 센스 있는 선물 찾아야겠삼! 건강 보조식품, 마사지기, 아니면 홈트용 요가 매트나 스트레칭 밴드 어떰? 아님 집에서 쓸 수 있는 공기청정기나 좋은 차 세트도 짱일 것 같삼! 엄마 건강 챙기는 멋진 키노 친구가 되어줄게! 더 아이디어 필요하면 말해보삼!',
      createdAt: t4_17,
      messageType: 'text',
    },
    {
      messageId: 'mock-user-4',
      senderId: me,
      content: '엄마는 50대고 요즘 건강 신경 많이 쓰셔',
      createdAt: t4_17,
      messageType: 'text',
    },
    {
      messageId: 'mock-kino-3',
      senderId: kino,
      content:
        '우와, 엄마 생일이라니 완전 설레겠삼! 엄마가 좋아하는 거나 평소에 필요했던 거 생각해봤삼? 아니면 깜짝 이벤트나 편지 같은 감동 선물도 찰떡이지! 뭐든 엄마 마음에 쏙 들게 도와줄게, 같이 고민해보삼!',
      createdAt: t4_15,
      messageType: 'text',
    },
    {
      messageId: 'mock-user-2',
      senderId: me,
      content: '곧 있으면 엄마 생신인데 뭐 드릴까 고민돼..',
      createdAt: t4_15,
      messageType: 'text',
    },
    {
      messageId: 'mock-kino-1',
      senderId: kino,
      content:
        '안녕하세요! 저는 키노예요! 가족들이 하루 동안 느낀 일들, 나누고 싶은 순간들, 그 모든 따뜻한 기록을 한곳에 모아주는 역할을 하고 있어요. 여기선 무엇이든 편하게 말해줘요. 다 소중한 이야기니까요!',
      createdAt: t4_14,
      messageType: 'text',
    },
  ];
}

// ---------- 메모리(피드) 더미: 다섯 식구 부산 광안리 여행 ----------

/**
 * 메모리 피드 더미 (post1-1 부산 광안리, post3-1 엄마 생일 파티, graduate 막내 졸업)
 */
export function getStoreMockMemoryList() {
  const created = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();

  // 엄마 생신 26일 기준으로 게시글 날짜 설정 (2월 26일로 표시되도록)
  const year = new Date(now).getFullYear();
  const momBirthdayPostDate = new Date(year, 1, 26, 14, 0, 0).toISOString(); // 2월 26일

  return [
    {
      postId: 'mock-memory-surprise',
      content: '엄마 생신 🎂 다 같이 준비해서 더 의미 있었던 하루 🤍',
      createdAt: momBirthdayPostDate,
      categoryId: 'mock-cat-daily',
      categoryTitle: '일상',
      imageUrls: POST3_1 ? [POST3_1, POST3_1, POST3_1, POST3_1] : [],
      images: POST3_1
        ? [
            {imageUrl: POST3_1},
            {imageUrl: POST3_1},
            {imageUrl: POST3_1},
            {imageUrl: POST3_1},
          ]
        : [],
      authorName: '첫째',
      authorId: 'mock-first',
      authorImage: PROFILE_4,
      commentCount: 4,
    },
    {
      postId: 'mock-memory-1',
      content:
        '다섯 식구 부산 광안리 여행 🏖️ 광안대교 보면서 저녁 먹고 해운대 쪽 구경도 했어요. 다음에 또 가고 싶다!',
      createdAt: created,
      categoryId: 'mock-cat-travel',
      categoryTitle: '여행',
      imageUrls: POST1_1 ? [POST1_1, POST1_1, POST1_1, POST1_1] : [],
      images: POST1_1
        ? [
            {imageUrl: POST1_1},
            {imageUrl: POST1_1},
            {imageUrl: POST1_1},
            {imageUrl: POST1_1},
          ]
        : [],
      authorName: '첫째',
      authorId: 'mock-first',
      authorImage: PROFILE_4,
      commentCount: 3,
    },
    {
      postId: 'mock-memory-2',
      content:
        '막내 대학교 졸업했어요 🎓 드디어 졸업식! 다들 축하해줘서 고마워요~',
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      categoryId: 'mock-cat-daily',
      categoryTitle: '일상',
      imageUrls: GRADUATE ? [GRADUATE] : [],
      images: GRADUATE ? [{imageUrl: GRADUATE}] : [],
      authorName: '셋째',
      authorId: 'mock-third',
      authorImage: PROFILE_5,
      commentCount: 5,
    },
  ];
}

// ---------- 가족 채팅 더미 (홈 더미 구성원: 엄마, 아빠, 첫째, 둘째, 셋째) ----------

const MOCK_ROOM_FAMILY = 'mock-room-family';
const MOCK_ROOM_MOM = 'mock-room-mom';
const MOCK_ROOM_SECOND = 'mock-room-second';
const MOCK_ROOM_SURPRISE = 'mock-room-surprise';
const MOCK_ROOM_KINO = 'mock-kino';

/** 채팅방 목록 더미: 오늘 26일 기준, 방별 마지막 대화 날짜/내용 */
export function getStoreMockChatRoomList() {
  const y = new Date(now).getFullYear();
  const pad = n => String(n).padStart(2, '0');
  const ts = (month, day, h, min) =>
    `${y}-${pad(month)}-${pad(day)}T${pad(h)}:${pad(min)}:00.000`;
  const tKino = ts(2, 15, 16, 17);
  const tMom = ts(2, 19, 17, 30);
  const tFamily = ts(2, 21, 17, 5);
  const tSecond = ts(2, 17, 14, 10);
  const tSurprise = ts(2, 21, 18, 25);

  return [
    {
      chatRoomId: MOCK_ROOM_KINO,
      roomName: '키노상담소',
      latestMessageContent: '오! 건강 신경 쓰시는 엄마라면 엄청 센스 있는 선물 찾아야겠삼! 건강 보조식품, 마사지기, 아니면 홈트용 요가 매트나 스트레칭 밴드 어떰? 아님 집에서 쓸 수 있는 공기청정기나 좋은 차 세트도 짱일 것 같삼! 엄마 건강 챙기는 멋진 키노 친구가 되어줄게! 더 아이디어 필요하면 말해보삼!',
      latestMessageTime: tKino,
      unreadCount: 0,
      kino: true,
      notificationOn: true,
      userChatRooms: [],
      memberImages: KINO_YELLOW ? [KINO_YELLOW] : [],
    },
    {
      chatRoomId: MOCK_ROOM_FAMILY,
      roomName: '우리 가족',
      latestMessageContent: '지금 식당으로 가고 있어요',
      latestMessageTime: tFamily,
      unreadCount: 0,
      kino: false,
      notificationOn: true,
      userChatRooms: [
        {userId: 'mock-mom'},
        {userId: 'mock-dad'},
        {userId: 'mock-first'},
        {userId: 'mock-second'},
        {userId: 'mock-third'},
      ],
      memberImages: [PROFILE_1, PROFILE_2, PROFILE_3, PROFILE_5].filter(
        Boolean,
      ),
    },
    {
      chatRoomId: MOCK_ROOM_MOM,
      roomName: '엄마',
      latestMessageContent: '알겠어. 조심히 와',
      latestMessageTime: tMom,
      unreadCount: 0,
      kino: false,
      notificationOn: true,
      userChatRooms: [{userId: 'mock-mom'}, {userId: 'mock-first'}],
      memberImages: [PROFILE_1].filter(Boolean),
    },
    {
      chatRoomId: MOCK_ROOM_SECOND,
      roomName: '셋째',
      latestMessageContent: '언니 나 이번 주말에 친구들이랑 놀러 간다',
      latestMessageTime: tSecond,
      unreadCount: 0,
      kino: false,
      notificationOn: true,
      userChatRooms: [{userId: 'mock-third'}, {userId: 'mock-first'}],
      memberImages: [PROFILE_5].filter(Boolean),
    },
    {
      chatRoomId: MOCK_ROOM_SURPRISE,
      roomName: '엄마 생일 깜짝 파티',
      latestMessageContent: '케이크 차에서 가지고 올게요',
      latestMessageTime: tSurprise,
      unreadCount: 3,
      kino: false,
      notificationOn: true,
      userChatRooms: [
        {userId: 'mock-dad'},
        {userId: 'mock-first'},
        {userId: 'mock-second'},
        {userId: 'mock-third'},
      ],
      memberImages: [PROFILE_2, PROFILE_3, PROFILE_5].filter(Boolean),
    },
  ];
}

const MOCK_CHAT_ROOM_IDS = [
  MOCK_ROOM_KINO,
  MOCK_ROOM_FAMILY,
  MOCK_ROOM_MOM,
  MOCK_ROOM_SECOND,
  MOCK_ROOM_SURPRISE,
];

export function isStoreMockChatRoomId(chatRoomId) {
  return chatRoomId != null && MOCK_CHAT_ROOM_IDS.includes(String(chatRoomId));
}

/** 방별 채팅 메시지 더미 (DESC: 최신 first) - 오늘 26일 기준 */
export function getStoreMockChatMessages(chatRoomId, currentUserId) {
  const me = currentUserId || 'mock-first';
  const rid = String(chatRoomId);
  const y = new Date().getFullYear();
  const pad = n => String(n).padStart(2, '0');
  const tDate = (day, h, min) =>
    `${y}-02-${pad(day)}T${pad(h)}:${pad(min)}:00.000`;

  const msg = (id, senderId, name, image, content, createdAt) => ({
    messageId: id,
    senderId,
    senderName: name,
    senderImage: image,
    content,
    createdAt,
    messageType: 'text',
  });

  if (rid === MOCK_ROOM_FAMILY) {
    return [
      msg(
        'mf-6',
        'mock-mom',
        '엄마',
        PROFILE_1,
        '지금 식당으로 가고 있어요',
        tDate(26, 14, 5),
      ),
      msg(
        'mf-5',
        'mock-mom',
        '엄마',
        PROFILE_1,
        '그럼 내일 저녁은 제가 준비할게요',
        tDate(26, 14, 2),
      ),
      msg('mf-4', me, '첫째', PROFILE_4, '내일 저녁 뭐 먹을까요?', tDate(26, 14, 0)),
      msg(
        'mf-3',
        'mock-dad',
        '아빠',
        PROFILE_2,
        '다들 일정 괜찮지?',
        tDate(26, 13, 55),
      ),
      msg(
        'mf-2',
        'mock-third',
        '셋째',
        PROFILE_5,
        '저요 저요 괜찮아요',
        tDate(26, 13, 50),
      ),
      msg(
        'mf-1',
        'mock-second',
        '둘째',
        PROFILE_3,
        '이번 주말에 뭐해요?',
        tDate(26, 13, 45),
      ),
    ];
  }
  if (rid === MOCK_ROOM_MOM) {
    return [
      msg(
        'mm-3',
        'mock-mom',
        '엄마',
        PROFILE_1,
        '알겠어. 조심히 와',
        tDate(21, 17, 30),
      ),
      msg(
        'mm-2',
        me,
        '첫째',
        PROFILE_4,
        '엄마 저 오늘 늦게 들어갈게요',
        tDate(21, 17, 28),
      ),
      msg(
        'mm-1',
        'mock-mom',
        '엄마',
        PROFILE_1,
        '오늘 몇 시에 들어와?',
        tDate(21, 17, 25),
      ),
    ];
  }
  if (rid === MOCK_ROOM_SECOND) {
    return [
      msg('ms-3', me, '첫째', PROFILE_4, '좋아 잘 놀고 와', tDate(20, 14, 10)),
      msg(
        'ms-2',
        'mock-second',
        '둘째',
        PROFILE_3,
        '언니 나 이번 주말에 친구들이랑 놀러 간다',
        tDate(20, 14, 8),
      ),
      msg(
        'ms-1',
        'mock-second',
        '둘째',
        PROFILE_3,
        '언니 주말에 시간 돼?',
        tDate(20, 14, 5),
      ),
    ];
  }
  if (rid === MOCK_ROOM_SURPRISE) {
    return [
      msg(
        'mb-5',
        me,
        '첫째',
        PROFILE_4,
        '케이크 차에서 가지고 올게요',
        tDate(26, 18, 25),
      ),
      msg(
        'mb-4',
        'mock-dad',
        '아빠',
        PROFILE_2,
        '그럼 나는 장식 준비할게',
        tDate(26, 18, 22),
      ),
      msg(
        'mb-3',
        'mock-third',
        '셋째',
        PROFILE_5,
        '저는 엄마 끌고 나갈 때 연락할게요',
        tDate(26, 18, 20),
      ),
      msg(
        'mb-2',
        'mock-second',
        '둘째',
        PROFILE_3,
        '저녁은 제가 예약해둘게요',
        tDate(26, 18, 18),
      ),
      msg(
        'mb-1',
        'mock-dad',
        '아빠',
        PROFILE_2,
        '엄마 생일 깜짝 파티 준비하자',
        tDate(26, 18, 15),
      ),
    ];
  }
  return [];
}

/** 방별 참여자(채팅방 유저) 더미 - 설정/멘션용 */
export function getStoreMockChatRoomUsers(chatRoomId) {
  const rid = String(chatRoomId);
  const members = getStoreMockFamilyUserListForSchedule();
  const toUser = m => ({
    userId: m.userId,
    name: m.name,
    nickname: m.name,
    image: m.image,
    profileImage: m.image,
  });

  if (rid === MOCK_ROOM_FAMILY) {
    return members.map(toUser);
  }
  if (rid === MOCK_ROOM_MOM) {
    return members
      .filter(u => ['mock-mom', 'mock-first'].includes(u.userId))
      .map(toUser);
  }
  if (rid === MOCK_ROOM_SECOND) {
    return members
      .filter(u => ['mock-second', 'mock-first'].includes(u.userId))
      .map(toUser);
  }
  if (rid === MOCK_ROOM_SURPRISE) {
    return members
      .filter(u =>
        ['mock-dad', 'mock-first', 'mock-second', 'mock-third'].includes(
          u.userId,
        ),
      )
      .map(toUser);
  }
  if (rid === MOCK_ROOM_KINO) {
    return [];
  }
  return [];
}

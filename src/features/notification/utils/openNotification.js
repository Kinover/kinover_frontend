// src/utils/openNotification.js
import {safeNavigate, safeReset} from 'app/navigation/navigationService';

function toStr(v) {
  return v == null ? null : String(v);
}

function pickPostId(n) {
  const raw =
    n?.postId ??
    n?.post_id ??
    n?.memoryId ??
    n?.memory_id ??
    n?.targetId ??
    n?.target_id ??
    null;

  return toStr(raw);
}

function pickType(n) {
  return String((n && (n.pushType || n.notificationType)) || '')
    .toUpperCase()
    .trim();
}

// ✅ 라우트 state에 params 잘 넣기 (state 아래/route 아래 헷갈림 방지)
function withRouteParams(route, params) {
  if (!params) return route;
  return {...route, params: {...(route.params || {}), ...params}};
}

/**
 * ✅ 알림에서 이동 타입
 * - mode: 'navigate' | 'reset'
 *   - navigate: 기존 히스토리 유지 (푸시/일반 이동에 적합)
 *   - reset: 히스토리 제거 + (초기화면 -> 목적화면) 스택만 남김 (알림 클릭 UX에 적합)
 */
export async function openNotification(n, options = {}) {
  const {mode = 'navigate'} = options;

  const type = pickType(n);
  if (!type) return;

  const ROUTES = {
    ROOT_TAB: 'Tabs',

    TAB_HOME: '홈',
    TAB_COMM: '소통',
    TAB_SCHEDULE: '일정',
    TAB_MEMORY: '추억',

    // ✅ "각 탭 Stack의 initial screen 이름"으로 정확히 맞춰야 함
    // (탭 이름이랑 같다고 해서 항상 initial screen이 같은 건 아님)
    HOME_INITIAL: '홈',
    COMM_INITIAL: '소통', // <- 너 프로젝트의 소통 탭 stack 첫 화면 라우트명
    SCHEDULE_INITIAL: '일정', // <- 일정 탭 stack 첫 화면 라우트명
    MEMORY_INITIAL: '추억', // <- 추억 탭 stack 첫 화면 라우트명

    POST_SCREEN: '게시글화면',
    CHAT_ROOM_SCREEN: '채팅방화면',
    // ✅ 네 코드에서 SCHEDULE_LIST가 '일정화면'이었는데,
    // 위에 올린 프로젝트 코드에는 '일정목록' 같은 이름도 있었지?
    // "실제 Stack.Screen name"과 동일하게 맞춰야 함.
    SCHEDULE_LIST: '일정목록',
  };

  /**
   * ✅ reset: Tabs 자체 + 활성 탭 스택을 (초기화면 -> 목적화면) 2개만 남기기
   * - 결과:
   *   - 목적화면에서 back 하면 해당 탭의 초기화면으로만 감
   *   - 알림함/이전 히스토리는 완전히 사라짐
   */
  const resetToTabNestedScreen = (
    tabName,
    initialScreenName,
    targetScreenName,
    params,
  ) => {
    const tabRoutes = [
      ROUTES.TAB_HOME,
      ROUTES.TAB_COMM,
      ROUTES.TAB_SCHEDULE,
      ROUTES.TAB_MEMORY,
    ];

    const tabIndex = tabRoutes.indexOf(tabName);
    const activeIndex = tabIndex >= 0 ? tabIndex : 0;

    return safeReset({
      // ✅ 최상단은 Tabs 하나만 남김
      index: 0,
      routes: [
        {
          name: ROUTES.ROOT_TAB,
          state: {
            index: activeIndex,
            routes: tabRoutes.map(t => {
              // 다른 탭은 "탭만" 두고, 내부 스택은 건드리지 않음(초기화)
              if (t !== tabName) return {name: t};

              // ✅ 활성 탭 스택을 2개만 남김
              return {
                name: t,
                state: {
                  index: 1,
                  routes: [
                    {name: initialScreenName},
                    withRouteParams(
                      {name: targetScreenName},
                      {
                        ...(params || {}),
                        // ✅ 목적화면에서 백버튼 숨김 등 제어
                        _fromNotificationReset: true,
                      },
                    ),
                  ],
                },
              };
            }),
          },
        },
      ],
    });
  };

  // ✅ navigate 모드: 기존 쌓인 히스토리 유지
  const goPostNavigate = params =>
    safeNavigate(ROUTES.ROOT_TAB, {
      screen: ROUTES.TAB_MEMORY,
      params: {screen: ROUTES.POST_SCREEN, params},
    });

  const goChatNavigate = params =>
    safeNavigate(ROUTES.ROOT_TAB, {
      screen: ROUTES.TAB_COMM,
      params: {screen: ROUTES.CHAT_ROOM_SCREEN, params},
    });

  const goScheduleNavigate = params =>
    safeNavigate(ROUTES.ROOT_TAB, {
      screen: ROUTES.TAB_SCHEDULE,
      params: {screen: ROUTES.SCHEDULE_LIST, params},
    });

  // ✅ reset 모드
  const goPostReset = params =>
    resetToTabNestedScreen(
      ROUTES.TAB_MEMORY,
      ROUTES.MEMORY_INITIAL,
      ROUTES.POST_SCREEN,
      params,
    );

  const goChatReset = params =>
    resetToTabNestedScreen(
      ROUTES.TAB_COMM,
      ROUTES.COMM_INITIAL,
      ROUTES.CHAT_ROOM_SCREEN,
      params,
    );

  const goScheduleReset = params =>
    resetToTabNestedScreen(
      ROUTES.TAB_SCHEDULE,
      ROUTES.SCHEDULE_INITIAL,
      ROUTES.SCHEDULE_LIST,
      params,
    );

  const isReset = mode === 'reset';

  switch (type) {
    case 'POST':
    case 'COMMENT':
    case 'MENTION_COMMENT': {
      const postId = pickPostId(n);
      if (!postId) return;

      const params = {
        postId,
        highlightCommentId:
          type === 'COMMENT' || type === 'MENTION_COMMENT'
            ? toStr(n?.commentId)
            : null,
        from: 'notification',
      };

      if (isReset) goPostReset(params);
      else goPostNavigate(params);
      return;
    }

    case 'CHAT':
    case 'MENTION_CHAT': {
      const chatRoomId = toStr(n?.chatRoomId);
      if (!chatRoomId) {
        // ✅ roomId 없으면 소통탭만 열기(혹은 알림함으로 보내고 싶으면 여기서 변경)
        safeNavigate(ROUTES.ROOT_TAB, {screen: ROUTES.TAB_COMM});
        return;
      }

      const params = {chatRoomId, from: 'notification'};

      if (isReset) goChatReset(params);
      else goChatNavigate(params);
      return;
    }

    case 'SCHEDULE': {
      const scheduleId = toStr(n?.scheduleId);
      const params = scheduleId
        ? {scheduleId, from: 'notification'}
        : {from: 'notification'};

      // ✅ scheduleId가 없는데 reset을 때리면 "일정탭 초기->목록"이 어색할 수 있음
      //    이 경우는 탭 초기화면으로만 보내는 게 UX가 더 자연스러움.
      if (!scheduleId) {
        if (isReset) {
          safeReset({
            index: 0,
            routes: [{name: ROUTES.ROOT_TAB, state: {index: 2, routes: [
              {name: ROUTES.TAB_HOME},
              {name: ROUTES.TAB_COMM},
              {name: ROUTES.TAB_SCHEDULE, state: {index: 0, routes: [{name: ROUTES.SCHEDULE_INITIAL}]}},
              {name: ROUTES.TAB_MEMORY},
            ]}}],
          });
        } else {
          safeNavigate(ROUTES.ROOT_TAB, {screen: ROUTES.TAB_SCHEDULE});
        }
        return;
      }

      if (isReset) goScheduleReset(params);
      else goScheduleNavigate(params);
      return;
    }

    default:
      return;
  }
}

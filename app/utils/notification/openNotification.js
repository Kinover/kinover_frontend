// utils/openNotification.js
export async function openNotification(n, navigation, deps) {
  const type = n && n.notificationType;
  if (!type) return;

  const ROUTES = {
    ROOT_TAB: 'Tabs',
    TAB_HOME: '홈',
    TAB_MEMORY: '추억',
    TAB_COMM: '소통',
    TAB_SCHEDULE: '일정',
    POST_SCREEN: '게시글화면',
    CHAT_ROOM_SCREEN: '채팅방화면',
    SCHEDULE_LIST: '일정',
  };

  const goPost = params =>
    navigation.navigate(ROUTES.ROOT_TAB, {
      screen: ROUTES.TAB_MEMORY,
      params: {
        screen: ROUTES.POST_SCREEN,
        params,
      },
    });

  const goChatRoom = params =>
    navigation.navigate(ROUTES.ROOT_TAB, {
      screen: ROUTES.TAB_COMM,
      params: {
        screen: ROUTES.CHAT_ROOM_SCREEN,
        params,
      },
    });

  const goSchedule = params =>
    navigation.navigate(ROUTES.ROOT_TAB, {
      screen: ROUTES.TAB_SCHEDULE,
      params: {screen: ROUTES.SCHEDULE_LIST, params},
    });

  switch (type) {
    case 'POST': {
      if (!n.postId) return;

      let post = null;
      if (deps && typeof deps.ensurePostLoaded === 'function') {
        try {
          memory = await deps.ensurePostLoaded(n.postId);
        } catch (e) {}
      }

      goPost(post ? {postId: n.postId, memory} : {postId: n.postId});
      return;
    }

    case 'COMMENT': {
      if (!n.postId) return;

      let post = null;
      if (deps && typeof deps.ensurePostLoaded === 'function') {
        try {
          memory = await deps.ensurePostLoaded(n.postId);
        } catch (e) {}
      }

      goPost(
        post
          ? {postId: n.postId, memory, highlightCommentId: n.commentId || null}
          : {postId: n.postId, highlightCommentId: n.commentId || null},
      );
      return;
    }

    case 'CHAT': {
      if (n.chatRoomId) {
        goChatRoom({chatRoomId: n.chatRoomId});
      } else {
        navigation.navigate(ROUTES.ROOT_TAB, {screen: ROUTES.TAB_COMM});
      }
      return;
    }

    case 'SCHEDULE': {
      goSchedule(n.scheduleId ? {scheduleId: n.scheduleId} : undefined);
      return;
    }

    default:
      return;
  }
}

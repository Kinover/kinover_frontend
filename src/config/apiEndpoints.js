/**
 * API 엔드포인트 경로 상수
 * baseURL은 config/constants.js (API_BASE_URL), 실제 요청은 utils/apiClient 사용
 */

export const CHAT_ROOM = {
  BASE: '/chatRoom',
  list: (familyId, userId) => `/chatRoom/${familyId}/${userId}`,
  usersGet: chatRoomId => `/chatRoom/${chatRoomId}/users/get`,
  leave: chatRoomId => `/chatRoom/${chatRoomId}/leave`,
  rename: chatRoomId => `/chatRoom/${chatRoomId}/rename`,
  renameMe: chatRoomId => `/chatRoom/${chatRoomId}/rename/me`,
  create: () => '/chatRoom/create',
  addUsers: (chatRoomId, idsStr) => `/chatRoom/${chatRoomId}/addUsers/${idsStr}`,
  personality: chatRoomId => `/chatRoom/${chatRoomId}/personality`,
  notificationChatroom: () => '/chatRoom/notification/chatroom',
  media: chatRoomId => `/chatRoom/${chatRoomId}/media`,
  notificationUser: () => '/chatRoom/notification/user',
  one: chatRoomId => `/chatRoom/${chatRoomId}`,
  /** 채팅 멘션 알림 생성 (WS 전송 성공 후 호출) */
  notifyMentions: () => '/chatRoom/messages/notify-mentions',
};

export const SCHEDULES = {
  get: '/schedules/get',
  add: '/schedules/add',
  modify: '/schedules/modify',
  remove: scheduleId => `/schedules/remove/${scheduleId}`,
  countPerDay: '/schedules/count-per-day',
};

export const POSTS = {
  list: '/posts',
  one: postId => `/posts/${postId}`,
  delete: postId => `/posts/${postId}`,
  deleteImage: postId => `/posts/${postId}/image`,
  notificationPost: postId => `/posts/${postId}/notification`,
  notificationPostGlobal: '/posts/notification/post',
  /** 댓글: 게시글별 목록·추가 (많은 서버가 이 경로 사용) */
  comments: postId => `/posts/${postId}/comments`,
};

export const CATEGORIES = {
  list: '/categories',
  create: '/categories',
};

/** 댓글 삭제 등 단건 조작 (경로만) */
export const COMMENTS = {
  delete: commentId => `/comments/${commentId}`,
};

export const USER = {
  notifications: '/user/notifications',
  notificationsUnread: '/user/notifications/unread',
  notificationsUnreadCount: '/user/notifications/unread-count',
  notificationsMarkRead: '/user/notifications/mark-read',
};

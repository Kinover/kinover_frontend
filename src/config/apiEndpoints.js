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
  renameMe: chatRoomId => `/chatRoom/${chatRoomId}/renameMe`,
  create: () => '/chatRoom/create',
  addUsers: (chatRoomId, idsStr) => `/chatRoom/${chatRoomId}/addUsers/${idsStr}`,
  personality: chatRoomId => `/chatRoom/${chatRoomId}/personality`,
  notificationChatroom: () => '/chatRoom/notification/chatroom',
  media: chatRoomId => `/chatRoom/${chatRoomId}/media`,
  notificationUser: () => '/chatRoom/notification/user',
  one: chatRoomId => `/chatRoom/${chatRoomId}`,
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
};

export const CATEGORIES = {
  list: '/categories',
  create: '/categories',
};

export const USER = {
  notifications: '/user/notifications',
  notificationsUnread: '/user/notifications/unread',
  notificationsUnreadCount: '/user/notifications/unread-count',
  notificationsMarkRead: '/user/notifications/mark-read',
};

// src/hooks/notification/useNotificationRows.js
import {useMemo} from 'react';

/* =========================================================
 * 유틸
 * ========================================================= */

const formatWhen = iso => {
  if (!iso) return '';
  const d = new Date(iso);

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours < 12 ? '오전' : '오후';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const minuteStr = minutes.toString().padStart(2, '0');
  return `${ampm} ${hours}시 ${minuteStr}분`;
};

const sanitizeUrl = url => {
  if (!url || typeof url !== 'string') return '';
  return url.replace(
    /(https:\/\/dzqa9jgkeds0b\.cloudfront\.net\/)+/g,
    'https://dzqa9jgkeds0b.cloudfront.net/',
  );
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const sectionTitleFor = date => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(d, today)) return '오늘';
  if (isSameDay(d, yesterday)) return '어제';

  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}.${m}.${day}`;
};

const safeStr = v => (typeof v === 'string' ? v : v == null ? '' : String(v));

/**
 * 백엔드 기준: pushType / notificationType 둘 다 올 수 있음
 * - 서버에서 putPushType()로 둘 다 넣어주고 있음
 */
const resolveType = n =>
  n?.pushType || n?.notificationType || n?.type || 'DEFAULT';

/* =========================================================
 * 타입 메타 (백엔드 PushType 기준)
 * - CHAT, POST, COMMENT, MENTION_COMMENT, MENTION_CHAT
 * - (SCHEDULE은 백엔드 코드에 현재 없음. 있으면 여기 추가하면 됨)
 * ========================================================= */

const TYPE_META = {
  CHAT: {label: '채팅', color: 'black'},
  MENTION_CHAT: {label: '채팅 멘션', color: 'black'},

  POST: {label: '게시글', color: 'black'},
  COMMENT: {label: '댓글', color: 'black'},
  MENTION_COMMENT: {label: '댓글 멘션', color: 'black'},

  SCHEDULE: {label: '일정', color: 'black'}, // 혹시 나중에 들어오면 대비
  DEFAULT: {label: '알림', color: 'black'},
};

const getTypeMeta = t => TYPE_META[t] || TYPE_META.DEFAULT;

/* =========================================================
 * title/summary: 백엔드 payload에 맞춤
 *
 * 백엔드에서 들어오는 대표 필드들:
 * - authorName, authorImage
 * - categoryTitle
 * - contentPreview
 * - roomName (채팅)
 * - messageType (채팅)
 * - firstImageUrl (게시글/댓글 썸네일)
 * ========================================================= */

const buildTitle = (type, n) => {
  const roomName = safeStr(n?.roomName).trim();
  const categoryTitle = safeStr(n?.categoryTitle).trim();

  switch (type) {
    case 'CHAT':
    case 'MENTION_CHAT':
      return roomName || '채팅';
    case 'POST':
    case 'COMMENT':
    case 'MENTION_COMMENT':
      return categoryTitle || getTypeMeta(type).label;
    default:
      return categoryTitle || getTypeMeta(type).label;
  }
};

const buildSummary = (type, n) => {
  const name = safeStr(n?.authorName).trim();
  const author = name ? `${name} 님` : '누군가';

  const preview = safeStr(n?.contentPreview).trim(); // 글/댓글 미리보기
  const messageType = safeStr(n?.messageType).toLowerCase(); // text/image/video
  const roomName = safeStr(n?.roomName).trim(); // 채팅방명

  switch (type) {
    case 'CHAT': {
 // 백엔드 채팅 바디는 이미 "sender: ..." 로 만들어 보내고 있지만
 // 알림 리스트 요약은 더 짧게 유지하는 게 보통 보기 좋음
      if (messageType === 'image') return `${author}이 사진을 보냈어요.`;
      if (messageType === 'video') return `${author}이 동영상을 보냈어요.`;
      return `${author}이 메시지를 보냈어요.`;
    }

    case 'MENTION_CHAT': {
 // 백엔드 푸시 바디는 "당신을 언급했어요 · ..." 형태
 // 리스트에서는 멘션 강조
      if (roomName) return `${author}이 ${roomName}에서 당신을 언급했어요.`;
      return `${author}이 채팅에서 당신을 언급했어요.`;
    }

    case 'POST':
      return `${author}이 게시글을 작성했어요.`;

    case 'COMMENT':
      return `${author}이 댓글을 남겼어요.`;

    case 'MENTION_COMMENT':
      return `${author}이 댓글에서 당신을 언급했어요.`;

    case 'SCHEDULE':
 // 서버 스펙에 맞춰 titleText 같은 게 오면 그걸 쓰면 됨
      return `새 일정이 추가되었어요.`;

    default:
      return `${author}이 알림을 보냈어요.`;
  }
};

/**
 * preview: 백엔드가 contentPreview 내려주면 그걸 사용
 * - 채팅은 contentPreview가 없을 수 있음(있어도 body랑 중복될 수 있음)
 */
const buildPreview = (type, n) => {
  const preview = safeStr(n?.contentPreview).trim();

  if (type === 'POST' || type === 'COMMENT' || type === 'MENTION_COMMENT') {
    return preview;
  }

 // 채팅은 굳이 preview를 두 줄로 또 보여주면 지저분해질 수 있어서 비우는 걸 추천
  return preview;
};

/* =========================================================
 * 메인 훅
 * ========================================================= */

export const useNotificationRows = (notifications = [], lastChecked) => {
  return useMemo(() => {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    const result = [];
    let curSectionKey = null;

    sorted.forEach(n => {
      const sectionKey = sectionTitleFor(n.createdAt);

      if (sectionKey !== curSectionKey) {
        result.push({
          type: 'section',
          key: sectionKey,
          title: sectionKey,
        });
        curSectionKey = sectionKey;
      }

      const type = resolveType(n);
      const typeMeta = getTypeMeta(type);

      const authorImage = sanitizeUrl(n.authorImage);
      const firstImage = sanitizeUrl(n.firstImageUrl);

      const when = formatWhen(n.createdAt);

      const title = buildTitle(type, n);
      const summary = buildSummary(type, n);
      const preview = buildPreview(type, n);

      const isNew =
        lastChecked && n.createdAt
          ? new Date(n.createdAt).getTime() > lastChecked.getTime()
          : false;

 /**
 * 좌측 이미지 정책(백엔드 기준)
 * - POST/COMMENT/MENTION_COMMENT: firstImageUrl 우선(게시글 이미지)
 * - CHAT/MENTION_CHAT: authorImage
 * - 없으면 authorImage fallback
 */
      let leftImageUrl = authorImage;

      if (type === 'POST' || type === 'COMMENT' || type === 'MENTION_COMMENT') {
        leftImageUrl = firstImage || authorImage;
      } else if (type === 'CHAT' || type === 'MENTION_CHAT') {
        leftImageUrl = authorImage;
      } else {
        leftImageUrl = authorImage || firstImage;
      }

      result.push({
        type: 'item',
        key: n.notificationId || `${type}-${n.createdAt}-${n.postId || ''}`,
        notification: n,
        isNew,
        leftImageUrl,
        when,
        title,
        summary,
        preview,
        typeColor: typeMeta.color,
      });
    });

    return result;
  }, [notifications, lastChecked]);
};

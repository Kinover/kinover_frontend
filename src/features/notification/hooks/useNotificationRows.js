// src/hooks/notification/useNotificationRows.js
import {useMemo} from 'react';

// ===== 유틸 함수들 =====
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

const TYPE_META = {
  CHAT: {label: '채팅', color: 'black'},
  SCHEDULE: {label: '일정', color: 'black'},
  POST: {label: '게시글', color: 'black'},
  COMMENT: {label: '댓글', color: 'black'},
  DEFAULT: {label: '알림', color: 'black'},
};

const getTypeMeta = t => TYPE_META[t] || TYPE_META.DEFAULT;

const buildSummary = (type, authorName, titleText) => {
  switch (type) {
    case 'CHAT':
      return `${authorName} 님이 메시지를 보냈어요.`;
    case 'SCHEDULE':
      return titleText
        ? `일정이 추가되었어요: ${titleText}`
        : `일정이 추가되었어요.`;
    case 'POST':
      return `${authorName} 님이 게시글을 추가했어요.`;
    case 'COMMENT':
      return `${authorName} 님이 댓글을 추가했어요.`;
    default:
      return `${authorName} 님이 알림을 보냈어요.`;
  }
};

// ===== 메인 훅 =====
export const useNotificationRows = (notifications = [], lastChecked) => {
  return useMemo(() => {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    const result = [];
    let curSectionKey = null;

    sorted.forEach(n => {
      const sectionKey = sectionTitleFor(n.createdAt);

      // 섹션 헤더
      if (sectionKey !== curSectionKey) {
        result.push({
          type: 'section',
          key: sectionKey,
          title: sectionKey,
        });
        curSectionKey = sectionKey;
      }

      const authorImage = sanitizeUrl(n.authorImage);
      const firstImage = sanitizeUrl(n.firstImageUrl);
      const when = formatWhen(n.createdAt);
      const typeMeta = getTypeMeta(n.notificationType);
      const title = n.categoryTitle || typeMeta.label;
      const summary = buildSummary(
        n.notificationType,
        n.authorName,
        n.categoryTitle,
      );
      const preview = (n.contentPreview || '').trim();

      const isNew =
        lastChecked && n.createdAt
          ? new Date(n.createdAt).getTime() > lastChecked.getTime()
          : false;

      const leftImageUrl =
        n.notificationType === 'POST' || n.notificationType === 'COMMENT'
          ? firstImage
          : authorImage;

      result.push({
        type: 'item',
        key: n.notificationId || `${n.notificationType}-${n.createdAt}`,
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

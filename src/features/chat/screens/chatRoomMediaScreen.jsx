// src/features/chat/screens/ChatRoomMediaScreen.jsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  FlatList,
  Platform,
  Dimensions,
} from 'react-native';

import {useDispatch} from 'react-redux';

import {fetchChatRoomMediaThunk} from '../store/chatRoomThunk';
import MediaModal from '../components/MediaModal';

import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';

import {COLORS, LAYOUT_STYLE} from 'styles/style';

export default function ChatRoomMediaScreen({navigation, route}) {
  const dispatch = useDispatch();

  const chatRoomId = route?.params?.chatRoomId ?? null;
  const initialType = String(route?.params?.initialType ?? 'ALL').toUpperCase(); // ALL | IMAGE | VIDEO

  // =========================================================
  // ✅ 상태
  // =========================================================
  const [type, setType] = useState(
    ['ALL', 'IMAGE', 'VIDEO'].includes(initialType) ? initialType : 'ALL',
  );

  // ✅ 2~4 열 조절
  const [columns, setColumns] = useState(3); // 2 | 3 | 4

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [moreLoading, setMoreLoading] = useState(false);
  const [nextBefore, setNextBefore] = useState(null);

  // ✅ MediaModal
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [modalMediaItems, setModalMediaItems] = useState([]); // [{kind,url,thumb}]
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  const fetchingFirstRef = useRef(false);

  // =========================================================
  // ✅ 유틸
  // =========================================================
  const pickThumbUri = item =>
    item?.thumbnailUrl ||
    item?.thumbUrl ||
    item?.imageUrl ||
    item?.videoThumbnailUrl ||
    item?.url ||
    (Array.isArray(item?.imageUrls) ? item.imageUrls[0] : null) ||
    (Array.isArray(item?.mediaUrls) ? item.mediaUrls[0] : null) ||
    null;

  const pickMediaUri = item =>
    item?.url ||
    item?.imageUrl ||
    item?.videoUrl ||
    (Array.isArray(item?.imageUrls) ? item.imageUrls[0] : null) ||
    (Array.isArray(item?.mediaUrls) ? item.mediaUrls[0] : null) ||
    null;

  const normalizeMediaType = item => {
    const t = String(item?.messageType || item?.type || '').toUpperCase();
    if (t.includes('VIDEO')) return 'VIDEO';
    if (t.includes('IMAGE') || t.includes('PHOTO')) return 'IMAGE';
    return 'FILE';
  };

  const getMediaKey = item =>
    item?.messageId ||
    item?.id ||
    item?.uuid ||
    item?.mediaId ||
    pickMediaUri(item) ||
    null;

  // =========================================================
  // ✅ API
  // =========================================================
  const fetchFirst = useCallback(
    async (nextType = type) => {
      if (!chatRoomId) return;
      if (fetchingFirstRef.current) return;

      fetchingFirstRef.current = true;
      setLoading(true);

      try {
        const res = await dispatch(
          fetchChatRoomMediaThunk({
            chatRoomId,
            type: nextType,
            before: null,
            limit: 30,
          }),
        ).unwrap();

        const list = Array.isArray(res?.items) ? res.items : [];
        setItems(list);
        setNextBefore(res?.nextBefore ?? null);
      } catch (e) {
        console.warn('❌ ChatRoomMediaScreen fetchFirst 실패:', e);
        setItems([]);
        setNextBefore(null);
      } finally {
        setLoading(false);
        fetchingFirstRef.current = false;
      }
    },
    [dispatch, chatRoomId, type],
  );

  const fetchMore = useCallback(async () => {
    if (!chatRoomId) return;
    if (!nextBefore) return;
    if (moreLoading) return;

    setMoreLoading(true);
    try {
      const res = await dispatch(
        fetchChatRoomMediaThunk({
          chatRoomId,
          type,
          before: nextBefore,
          limit: 30,
        }),
      ).unwrap();

      const nextList = Array.isArray(res?.items) ? res.items : [];
      setItems(prev => [...prev, ...nextList]);
      setNextBefore(res?.nextBefore ?? null);
    } catch (e) {
      console.warn('❌ ChatRoomMediaScreen fetchMore 실패:', e);
    } finally {
      setMoreLoading(false);
    }
  }, [dispatch, chatRoomId, nextBefore, moreLoading, type]);

  // =========================================================
  // ✅ 탭 변경
  // =========================================================
  const onChangeType = useCallback(
    async next => {
      const upper = String(next).toUpperCase();
      if (upper === type) return;
      setType(upper);
      await fetchFirst(upper);
    },
    [type, fetchFirst],
  );

  // =========================================================
  // ✅ 최초 로드
  // =========================================================
  useEffect(() => {
    if (!chatRoomId) return;
    fetchFirst(type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRoomId]);

  // =========================================================
  // ✅ 모달 열기
  // =========================================================
  const openMediaModal = useCallback(
    (pressedItem, pressedIndex) => {
      const pressedKind = normalizeMediaType(pressedItem);
      const pressedUri = pickMediaUri(pressedItem);
      if (!pressedUri) return;
      if (pressedKind === 'FILE') return;

      const allowKind =
        type === 'ALL'
          ? ['IMAGE', 'VIDEO']
          : type === 'IMAGE'
          ? ['IMAGE']
          : ['VIDEO'];

      const list = (items || [])
        .map(it => {
          const kind = normalizeMediaType(it);
          const url = pickMediaUri(it);
          const thumb = pickThumbUri(it) || url;
          return {kind, url, thumb};
        })
        .filter(x => allowKind.includes(x.kind) && !!x.url);

      if (!list.length) return;

      const foundIndex = list.findIndex(
        x => String(x.url) === String(pressedUri),
      );
      const nextIndex =
        foundIndex >= 0 ? foundIndex : Math.max(0, pressedIndex || 0);

      setModalMediaItems(list);
      setModalInitialIndex(nextIndex);
      setMediaModalVisible(true);
    },
    [items, type],
  );

  const closeMediaModal = useCallback(() => {
    setMediaModalVisible(false);
    setTimeout(() => {
      setModalMediaItems([]);
      setModalInitialIndex(0);
    }, 0);
  }, []);

  // =========================================================
  // ✅ 레이아웃: 화면 실제 width 기반 + 가운데 정렬
  // =========================================================
  const windowW = Dimensions.get('window').width;

  // “보기 좋게” 패딩/간격 고정
  const screenPaddingH = getResponsiveWidth(18);
  const gridGap = getResponsiveWidth(8);

  // ✅ cellSize = (실제 사용가능 폭 - gap*(columns-1)) / columns
  const cellSize = useMemo(() => {
    const usableW = windowW - screenPaddingH * 2;
    const totalGap = gridGap * (columns - 1);
    const raw = (usableW - totalGap) / columns;
    return Math.floor(raw);
  }, [windowW, screenPaddingH, gridGap, columns]);

  // ✅ 그리드 전체 폭(셀 + gap) → 남는 여백을 좌우로 나눠서 가운데 정렬
  const gridWidth = useMemo(() => {
    return cellSize * columns + gridGap * (columns - 1);
  }, [cellSize, columns, gridGap]);

  const sideInset = useMemo(() => {
    const usableW = windowW - screenPaddingH * 2;
    const remain = usableW - gridWidth;
    return remain > 0 ? remain / 2 : 0;
  }, [windowW, screenPaddingH, gridWidth]);

  const renderCell = useCallback(
    ({item, index}) => {
      const thumb = pickThumbUri(item) || pickMediaUri(item);
      const kind = normalizeMediaType(item);

      const isLastCol = index % columns === columns - 1;

      return (
        <TouchableOpacity
          style={[
            styles.mediaCell,
            {
              width: cellSize,
              height: cellSize,
              marginRight: isLastCol ? 0 : gridGap,
              marginBottom: gridGap,
            },
          ]}
          activeOpacity={0.88}
          onPress={() => openMediaModal(item, index)}>
          {thumb ? (
            <Image source={{uri: thumb}} style={styles.mediaThumb} />
          ) : (
            <View style={styles.mediaPlaceholder}>
              <Text allowFontScaling={false} style={styles.mediaPlaceholderText}>
                {kind === 'VIDEO' ? 'VIDEO' : 'FILE'}
              </Text>
            </View>
          )}

          {kind === 'VIDEO' && (
            <View style={styles.videoBadge}>
              <Text allowFontScaling={false} style={styles.videoBadgeText}>영상</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [cellSize, gridGap, openMediaModal, columns],
  );

  // =========================================================
  // ✅ 그리드 크기(2~4) 조절 UI
  // =========================================================
  const GridSizePicker = useMemo(() => {
    return (
      <View style={[styles.sizeRow, {paddingHorizontal: screenPaddingH}]}>
        <Text allowFontScaling={false} style={styles.sizeLabel}>그리드</Text>

        {[2, 3, 4].map(n => {
          const active = columns === n;
          return (
            <TouchableOpacity
              key={String(n)}
              onPress={() => setColumns(n)}
              style={[styles.sizeBtn, active && styles.sizeBtnActive]}
              activeOpacity={0.9}>
              <Text allowFontScaling={false}
                style={[
                  styles.sizeBtnText,
                  active && styles.sizeBtnTextActive,
                ]}>
                {n}x{n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [columns, screenPaddingH]);

  return (
    <View style={styles.page}>
      {/* ✅ 탭 */}
      <View style={[styles.tabs, {paddingHorizontal: screenPaddingH}]}>
        {['ALL', 'IMAGE', 'VIDEO'].map(t => {
          const active = type === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => onChangeType(t)}
              style={[styles.tab, active && styles.tabActive]}
              activeOpacity={0.9}>
              <Text allowFontScaling={false} style={[styles.tabText, active && styles.tabTextActive]}>
                {t === 'ALL' ? '전체' : t === 'IMAGE' ? '사진' : '영상'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ✅ 그리드 크기 조절 */}
      {GridSizePicker}

      {/* ✅ 컨텐츠 */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator />
          <Text allowFontScaling={false} style={styles.loadingText}>불러오는 중…</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerBox}>
          <Text allowFontScaling={false} style={styles.emptyText}>아직 모아볼 미디어가 없어요.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderCell}
          keyExtractor={(item, idx) =>
            `${String(getMediaKey(item) ?? 'noid')}_${idx}`
          }
          numColumns={columns}
          // ✅ columns 변경 시 레이아웃 재구성되게 key를 컬럼 수에 의존
          key={`media-grid-${columns}`}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          contentContainerStyle={{
            paddingTop: getResponsiveHeight(10),
            paddingBottom: getResponsiveHeight(30),
            paddingHorizontal: screenPaddingH,
          }}
          // ✅ row(줄) 자체를 가운데 정렬
          columnWrapperStyle={{
            justifyContent: 'flex-start',
            paddingLeft: sideInset,
            paddingRight: sideInset,
          }}
          onEndReached={() => {
            if (moreLoading) return;
            if (!nextBefore) return;
            fetchMore();
          }}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            moreLoading ? (
              <View
                style={{
                  paddingVertical: getResponsiveHeight(14),
                  alignItems: 'center',
                }}>
                <ActivityIndicator />
              </View>
            ) : (
              <View style={{height: getResponsiveHeight(10)}} />
            )
          }
        />
      )}

      {/* ✅ 뷰어 모달 */}
      <MediaModal
        visible={mediaModalVisible}
        mediaItems={modalMediaItems}
        initialIndex={modalInitialIndex}
        onClose={closeMediaModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  tabs: {
    flexDirection: 'row',
    columnGap: getResponsiveWidth(8),
    marginTop: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(8),
  },
  tab: {
    paddingVertical: getResponsiveHeight(7),
    paddingHorizontal: LAYOUT_STYLE().screenPaddingHorizontal,
    borderRadius: getResponsiveIconSize(10),
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#FEF3C7',
  },
  tabText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#B45309',
  },

  // ✅ 그리드 사이즈 선택
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: getResponsiveWidth(8),
    marginTop: getResponsiveHeight(6),
    marginBottom: getResponsiveHeight(8),
  },
  sizeLabel: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textSecondary,
    marginRight: getResponsiveWidth(6),
  },
  sizeBtn: {
    paddingVertical: getResponsiveHeight(6),
    paddingHorizontal: getResponsiveWidth(10),
    borderRadius: getResponsiveIconSize(14),
    backgroundColor: '#F3F4F6',
  },
  sizeBtnActive: {
    backgroundColor: '#E5E7EB',
  },
  sizeBtnText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: '#6B7280',
  },
  sizeBtnTextActive: {
    color: '#111827',
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: getResponsiveHeight(8),
  },
  loadingText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
  },
  emptyText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
  },

  mediaCell: {
    borderRadius: getResponsiveIconSize(10),
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  mediaThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mediaPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPlaceholderText: {
    fontSize: getResponsiveFontSize(11),
    color: '#6B7280',
    fontFamily: 'Pretendard-Medium',
  },

  videoBadge: {
    position: 'absolute',
    right: getResponsiveWidth(6),
    bottom: getResponsiveHeight(6),
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(3),
    borderRadius: getResponsiveIconSize(10),
  },
  videoBadgeText: {
    fontSize: getResponsiveFontSize(10),
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Medium',
  },
});

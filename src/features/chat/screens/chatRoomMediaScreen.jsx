import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import {useGetChatRoomMediaQuery} from '../services/chatApi';
import MediaModal from '../components/messages/mediaModal';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';
import {COLORS, LAYOUT_STYLE} from 'styles/style';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ChatRoomMediaScreen({route}) {
  const styles = useScaledStyleSheet(rf => ({
    page: {flex: 1, backgroundColor: '#FFFFFF'},
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
    tabActive: {backgroundColor: '#FEF3C7'},
    tabText: {
      fontSize: rf(12),
      fontFamily: 'Pretendard-Medium',
      color: '#6B7280',
    },
    tabTextActive: {color: '#B45309'},
    sizeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: getResponsiveWidth(8),
      marginTop: getResponsiveHeight(6),
      marginBottom: getResponsiveHeight(8),
    },
    sizeLabel: {
      fontSize: rf(12),
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
    sizeBtnActive: {backgroundColor: '#E5E7EB'},
    sizeBtnText: {
      fontSize: rf(12),
      fontFamily: 'Pretendard-Medium',
      color: '#6B7280',
    },
    sizeBtnTextActive: {color: '#111827'},
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      rowGap: getResponsiveHeight(8),
    },
    helperText: {
      fontSize: rf(12),
      fontFamily: 'Pretendard-Regular',
      color: '#6B7280',
    },
    mediaCell: {
      borderRadius: getResponsiveIconSize(10),
      overflow: 'hidden',
      backgroundColor: '#F3F4F6',
    },
    mediaThumb: {width: '100%', height: '100%', resizeMode: 'cover'},
    mediaPlaceholder: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    mediaPlaceholderText: {
      fontSize: rf(11),
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
      fontSize: rf(10),
      color: '#FFFFFF',
      fontFamily: 'Pretendard-Medium',
    },
  }));

  const chatRoomId = route?.params?.chatRoomId ?? null;
  const initialType = String(route?.params?.initialType ?? 'ALL').toUpperCase();
  const [type, setType] = useState(
    ['ALL', 'IMAGE', 'VIDEO'].includes(initialType) ? initialType : 'ALL',
  );
  const [columns, setColumns] = useState(3);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [modalMediaItems, setModalMediaItems] = useState([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  const {
    data: mediaData,
    isLoading,
    isFetching,
  } = useGetChatRoomMediaQuery(
    {chatRoomId, type, before: null, limit: 200},
    {skip: !chatRoomId},
  );

  const items = useMemo(
    () => (Array.isArray(mediaData?.items) ? mediaData.items : []),
    [mediaData],
  );

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
    item?.messageId || item?.id || item?.uuid || item?.mediaId || pickMediaUri(item);

  const screenPaddingH = getResponsiveWidth(18);
  const gridGap = getResponsiveWidth(8);
  const cellSize = useMemo(() => {
    const usableW = SCREEN_WIDTH - screenPaddingH * 2;
    const totalGap = gridGap * (columns - 1);
    return Math.floor((usableW - totalGap) / columns);
  }, [columns, gridGap, screenPaddingH]);
  const gridWidth = useMemo(
    () => cellSize * columns + gridGap * (columns - 1),
    [cellSize, columns, gridGap],
  );
  const sideInset = useMemo(() => {
    const usableW = SCREEN_WIDTH - screenPaddingH * 2;
    return Math.max(0, (usableW - gridWidth) / 2);
  }, [gridWidth, screenPaddingH]);

  const openMediaModal = useCallback(
    (pressedItem, pressedIndex) => {
      const pressedKind = normalizeMediaType(pressedItem);
      const pressedUri = pickMediaUri(pressedItem);
      if (!pressedUri || pressedKind === 'FILE') return;

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
      const foundIndex = list.findIndex(x => String(x.url) === String(pressedUri));
      setModalMediaItems(list);
      setModalInitialIndex(foundIndex >= 0 ? foundIndex : Math.max(0, pressedIndex || 0));
      setMediaModalVisible(true);
    },
    [items, type],
  );

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
              <AppText allowFontScaling={false} style={styles.mediaPlaceholderText}>
                {kind === 'VIDEO' ? 'VIDEO' : 'FILE'}
              </AppText>
            </View>
          )}

          {kind === 'VIDEO' && (
            <View style={styles.videoBadge}>
              <AppText allowFontScaling={false} style={styles.videoBadgeText}>
                동영상
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [cellSize, columns, gridGap, openMediaModal, styles],
  );

  return (
    <View style={styles.page}>
      <View style={[styles.tabs, {paddingHorizontal: screenPaddingH}]}>
        {['ALL', 'IMAGE', 'VIDEO'].map(t => {
          const active = type === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={[styles.tab, active && styles.tabActive]}
              activeOpacity={0.9}>
              <AppText allowFontScaling={false} style={[styles.tabText, active && styles.tabTextActive]}>
                {t === 'ALL' ? '전체' : t === 'IMAGE' ? '사진' : '동영상'}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.sizeRow, {paddingHorizontal: screenPaddingH}]}>
        <AppText allowFontScaling={false} style={styles.sizeLabel}>
          그리드
        </AppText>
        {[2, 3, 4].map(n => {
          const active = columns === n;
          return (
            <TouchableOpacity
              key={String(n)}
              onPress={() => setColumns(n)}
              style={[styles.sizeBtn, active && styles.sizeBtnActive]}
              activeOpacity={0.9}>
              <AppText
                allowFontScaling={false}
                style={[styles.sizeBtnText, active && styles.sizeBtnTextActive]}>
                {n}x{n}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator />
          <AppText allowFontScaling={false} style={styles.helperText}>
            미디어를 불러오는 중이에요
          </AppText>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerBox}>
          <AppText allowFontScaling={false} style={styles.helperText}>
            아직 모아볼 미디어가 없어요.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderCell}
          keyExtractor={(item, idx) => `${String(getMediaKey(item) ?? 'noid')}_${idx}`}
          numColumns={columns}
          key={`media-grid-${columns}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: getResponsiveHeight(10),
            paddingBottom: getResponsiveHeight(30),
            paddingHorizontal: screenPaddingH,
          }}
          columnWrapperStyle={{
            justifyContent: 'flex-start',
            paddingLeft: sideInset,
            paddingRight: sideInset,
          }}
          ListFooterComponent={
            isFetching ? (
              <View style={{paddingVertical: getResponsiveHeight(14), alignItems: 'center'}}>
                <ActivityIndicator />
              </View>
            ) : (
              <View style={{height: getResponsiveHeight(10)}} />
            )
          }
        />
      )}

      <MediaModal
        visible={mediaModalVisible}
        mediaItems={modalMediaItems}
        initialIndex={modalInitialIndex}
        onClose={() => setMediaModalVisible(false)}
      />
    </View>
  );
}

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
import {COLORS} from 'styles/style';
import {FONTS} from 'styles/typography';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMNS = 3;
const SCREEN_PADDING_H = getResponsiveWidth(16);
const GRID_GAP = getResponsiveWidth(3);

const CELL_SIZE = Math.floor(
  (SCREEN_WIDTH - SCREEN_PADDING_H * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS,
);

const TABS = [
  {key: 'ALL', label: '전체'},
  {key: 'IMAGE', label: '사진'},
  {key: 'VIDEO', label: '동영상'},
];

export default function ChatRoomMediaScreen({route}) {
  const styles = useScaledStyleSheet(rf => ({
    page: {flex: 1, backgroundColor: '#F5F5F5'},

    tabRow: {
      flexDirection: 'row',
      paddingHorizontal: SCREEN_PADDING_H,
      paddingTop: getResponsiveHeight(14),
      paddingBottom: getResponsiveHeight(10),
      gap: getResponsiveWidth(8),
    },
    tab: {
      paddingVertical: getResponsiveHeight(7),
      paddingHorizontal: getResponsiveWidth(16),
      borderRadius: getResponsiveIconSize(20),
      backgroundColor: '#FFFFFF',
    },
    tabActive: {
      backgroundColor: '#111827',
    },
    tabText: {
      fontSize: rf(13),
      fontFamily: FONTS.MEDIUM,
      color: '#9CA3AF',
    },
    tabTextActive: {
      color: '#FFFFFF',
      fontFamily: FONTS.SEMI_BOLD,
    },

    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      rowGap: getResponsiveHeight(8),
    },
    emptyIcon: {
      width: getResponsiveWidth(34),
      height: getResponsiveWidth(34),
      resizeMode: 'contain',
      tintColor: '#9CA3AF',
      marginBottom: getResponsiveHeight(8),
    },
    helperText: {
      fontSize: rf(13),
      fontFamily: FONTS.REGULAR,
      color: '#9CA3AF',
    },

    mediaCell: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      backgroundColor: '#E5E7EB',
      overflow: 'hidden',
    },
    mediaThumb: {width: '100%', height: '100%', resizeMode: 'cover'},
    mediaPlaceholder: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    mediaPlaceholderText: {
      fontSize: rf(11),
      color: '#9CA3AF',
      fontFamily: FONTS.MEDIUM,
    },

    videoBadge: {
      position: 'absolute',
      right: getResponsiveWidth(5),
      bottom: getResponsiveHeight(5),
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingHorizontal: getResponsiveWidth(5),
      paddingVertical: getResponsiveHeight(2),
      borderRadius: getResponsiveIconSize(6),
    },
    videoBadgeText: {
      fontSize: rf(10),
      color: '#FFFFFF',
      fontFamily: FONTS.MEDIUM,
    },
  }));

  const chatRoomId = route?.params?.chatRoomId ?? null;
  const initialType = String(route?.params?.initialType ?? 'ALL').toUpperCase();
  const [type, setType] = useState(
    ['ALL', 'IMAGE', 'VIDEO'].includes(initialType) ? initialType : 'ALL',
  );
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [modalMediaItems, setModalMediaItems] = useState([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  const {data: mediaData, isLoading, isFetching} = useGetChatRoomMediaQuery(
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

  const openMediaModal = useCallback(
    (pressedItem, pressedIndex) => {
      const pressedKind = normalizeMediaType(pressedItem);
      const pressedUri = pickMediaUri(pressedItem);
      if (!pressedUri || pressedKind === 'FILE') return;

      const allowKind =
        type === 'ALL' ? ['IMAGE', 'VIDEO'] : type === 'IMAGE' ? ['IMAGE'] : ['VIDEO'];

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
      const isLastCol = index % COLUMNS === COLUMNS - 1;
      return (
        <TouchableOpacity
          style={[
            styles.mediaCell,
            {marginRight: isLastCol ? 0 : GRID_GAP, marginBottom: GRID_GAP},
          ]}
          activeOpacity={0.85}
          onPress={() => openMediaModal(item, index)}>
          {thumb ? (
            <Image source={{uri: thumb}} style={styles.mediaThumb} />
          ) : (
            <View style={styles.mediaPlaceholder}>
              <AppText allowFontScaling={false} style={styles.mediaPlaceholderText}>
                {kind === 'VIDEO' ? '동영상' : '파일'}
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
    [openMediaModal, styles],
  );

  return (
    <View style={styles.page}>
      {/* 탭 */}
      <View style={styles.tabRow}>
        {TABS.map(({key, label}) => {
          const active = type === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setType(key)}
              style={[styles.tab, active && styles.tabActive]}
              activeOpacity={0.85}>
              <AppText
                allowFontScaling={false}
                style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={COLORS.brandPrimary} />
          <AppText allowFontScaling={false} style={styles.helperText}>
            불러오는 중이에요
          </AppText>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerBox}>
          <Image
            source={require('../../../assets/icons/tabs/4/camera.png')}
            style={styles.emptyIcon}
          />
          <AppText allowFontScaling={false} style={styles.helperText}>
            아직 모아볼 사진이 없어요
          </AppText>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderCell}
          keyExtractor={(item, idx) =>
            `${String(getMediaKey(item) ?? 'noid')}_${idx}`
          }
          numColumns={COLUMNS}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: SCREEN_PADDING_H,
            paddingBottom: getResponsiveHeight(30),
          }}
          ListFooterComponent={
            isFetching ? (
              <View style={{paddingVertical: getResponsiveHeight(14), alignItems: 'center'}}>
                <ActivityIndicator color={COLORS.brandPrimary} />
              </View>
            ) : null
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

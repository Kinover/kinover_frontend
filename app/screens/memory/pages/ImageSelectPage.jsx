import React, {useEffect, useState, useLayoutEffect} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import {useNavigation} from '@react-navigation/native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import useHideTabBar from '../../../hooks/useHideTabBar';

// ====== 이미지 그리드 설정 ======
const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_MARGIN = getResponsiveWidth(2);
const NUM_COLUMNS = 3;
const IMAGE_SIZE =
  (SCREEN_WIDTH - IMAGE_MARGIN * (NUM_COLUMNS * 2)) / NUM_COLUMNS;

// 페이지당 불러올 이미지 개수
const PAGE_SIZE = 60;

export default function ImageSelectPage() {
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState([]);

  // 페이징/로딩 상태
  const [endCursor, setEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigation = useNavigation();

  // const route = useRoute();

  // // ✅ 넘어온 이미지(preselectedImages)가 있으면 selected 초기화
  // useEffect(() => {
  //   if (route.params?.preselectedImages?.length > 0) {
  //     setSelected(route.params.preselectedImages);
  //   }
  // }, [route.params?.preselectedImages]);

  // ===== 권한 요청 =====
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // ===== iOS ph:// → file:// 변환 =====
  const convertPhUriToFileUri = async (phUri, index) => {
    const destPath = `${
      RNFS.TemporaryDirectoryPath
    }photo_ios_${Date.now()}_${index}.jpg`;
    try {
      await RNFS.copyAssetsFileIOS(phUri, destPath, 0, 0);
      return 'file://' + destPath;
    } catch (err) {
      console.error('📛 iOS ph:// 변환 실패:', err.message);
      return null;
    }
  };

  // ===== Android content:// → file:// 변환 =====
  const convertContentUriToFileUri = async (contentUri, index) => {
    const destPath = `${
      RNFS.TemporaryDirectoryPath
    }photo_android_${Date.now()}_${index}.jpg`;
    try {
      const base64Data = await RNFS.readFile(contentUri, 'base64');
      await RNFS.writeFile(destPath, base64Data, 'base64');
      return 'file://' + destPath;
    } catch (err) {
      console.error('📛 Android content:// 변환 실패:', err.message);
      return null;
    }
  };

  // ===== 사진 불러오기 =====
  const loadPhotos = async (after = null) => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      console.log('⛔ 권한 거절됨');
      return;
    }

    try {
      const params = {
        first: PAGE_SIZE,
        assetType: 'Photos',
        ...(after ? {after} : {}),
      };
      const res = await CameraRoll.getPhotos(params);
      const photoData = res.edges.map(edge => edge.node.image);

      if (after) {
        setPhotos(prev => [...prev, ...photoData]);
      } else {
        setPhotos(photoData);
      }

      setEndCursor(res.page_info?.end_cursor ?? null);
      setHasNextPage(!!res.page_info?.has_next_page);
    } catch (err) {
      console.log('❌ getPhotos 실패:', err);
    }
  };

  useEffect(() => {
    loadPhotos(); // 초기 로드
  }, []);

  // 바닥 도달 시 다음 페이지 로드
  const handleEndReached = async () => {
    if (isLoadingMore || !hasNextPage || !endCursor) return;
    setIsLoadingMore(true);
    await loadPhotos(endCursor);
    setIsLoadingMore(false);
  };

  // 당겨서 새로고침
  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadPhotos(null);
    setIsRefreshing(false);
  };

  // ===== 선택 토글 =====
  const toggleSelect = uri => {
    setSelected(prev =>
      prev.includes(uri) ? prev.filter(u => u !== uri) : [...prev, uri],
    );
  };

  // ✅ 선택 순서 (1부터)
  const getSelectOrder = uri => {
    const idx = selected.indexOf(uri);
    return idx === -1 ? null : idx + 1;
  };

  // ===== 다음 버튼 =====
  const handleNext = async () => {
    if (selected.length === 0) {
      Alert.alert('이미지 선택', '최소 1장 이상 선택해 주세요.');
      return;
    }

    const convertedUris = [];
    for (let i = 0; i < selected.length; i++) {
      const uri = selected[i];

      if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
        const converted = await convertPhUriToFileUri(uri, i);
        if (converted) convertedUris.push(converted);
      } else if (Platform.OS === 'android' && uri.startsWith('content://')) {
        const converted = await convertContentUriToFileUri(uri, i);
        if (converted) convertedUris.push(converted);
      } else {
        convertedUris.push(uri);
      }
    }

    // ✅ 선택된 순서 그대로 전달
    navigation.navigate('카테고리선택화면', {
      selectedImages: convertedUris,
      from: '이미지선택화면',
    });
  };

  useHideTabBar();

  // ===== 헤더 UI =====
  useLayoutEffect(() => {
    const disabled = selected.length === 0;

    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle}>사진 업로드 ({selected.length})</Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleNext}
          disabled={disabled}
          style={[
            {marginRight: getResponsiveWidth(10)},
            disabled && {opacity: 0.4},
          ]}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={styles.checkIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [selected, navigation]);

  // ====== 렌더 ======
  const renderItem = ({item}) => {
    const isSelected = selected.includes(item.uri);
    const order = getSelectOrder(item.uri);

    return (
      <TouchableOpacity
        onPress={() => toggleSelect(item.uri)}
        activeOpacity={0.8}>
        <View style={[styles.imageWrapper, isSelected && styles.selectedImage]}>
          <Image source={{uri: item.uri}} style={styles.image} />
          {/* ✅ 선택 순서 뱃지 */}
          {isSelected && (
            <>
              <View style={styles.tileSelectedOverlay}></View>
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>{order}</Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={(item, index) => item.uri + index}
        renderItem={renderItem}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.galleryContainer}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        ListFooterComponent={
          isLoadingMore ? <Text style={styles.footer}></Text> : null
        }
      />

      {/* (선택) iOS 제한 권한 안내 */}
      {Platform.OS === 'ios' && photos.length < 10 && (
        <TouchableOpacity
          style={styles.permissionHint}
          onPress={() => Linking.openURL('app-settings:')}>
          <Text style={styles.permissionHintText}>
            사진이 적게 보이나요? 설정 &gt; 본 앱 &gt; 사진 &gt; “모든 사진”으로
            허용해 주세요.
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 2,
    borderColor: '#E5E5E5',
    paddingTop: getResponsiveHeight(2),
  },
  headerTitle: {
    fontSize:
      Platform.OS === 'ios'
        ? getResponsiveFontSize(20)
        : getResponsiveFontSize(18),
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'Pretendard-Regular',
    fontWeight: 'semibold',
    color: '#101010',
    lineHeight: getResponsiveHeight(30),
  },
  checkIcon: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(30),
    marginRight: getResponsiveWidth(15),
    resizeMode: 'contain',
  },
  galleryContainer: {},
  imageWrapper: {
    position: 'relative',
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: getResponsiveWidth(1),
    backgroundColor: 'rgba(128, 128, 128, 0.6)',
  },
  tileSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,

    zIndex: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.6)',
  },
  selectedImage: {
    borderWidth: 2,
    borderColor: '#FFC84D',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // ✅ 순서 뱃지 스타일
  orderBadge: {
    position: 'absolute',
    top: getResponsiveWidth(4),
    right: getResponsiveWidth(4),
    width: getResponsiveWidth(22),
    height: getResponsiveWidth(22),
    borderRadius: getResponsiveWidth(11),
    borderColor: '#FFC84D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    backgroundColor: '#fff',
    zIndex: 2,
  },
  orderBadgeText: {
    color: '#FFC84D',
    fontSize: getResponsiveIconSize(16),
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  footer: {
    textAlign: 'center',
    paddingVertical: getResponsiveHeight(12),
    color: '#666',
  },
  permissionHint: {
    position: 'absolute',
    bottom: getResponsiveHeight(10),
    left: getResponsiveWidth(10),
    right: getResponsiveWidth(10),
    backgroundColor: '#00000088',
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 8,
  },
  permissionHintText: {
    color: 'white',
    textAlign: 'center',
    fontSize: getResponsiveFontSize(12),
  },
});

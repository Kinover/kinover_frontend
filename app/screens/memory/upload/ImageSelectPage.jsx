import React, {useEffect, useState, useLayoutEffect} from 'react';
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import {useNavigation} from '@react-navigation/native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../../utils/responsive';
import {Dimensions} from 'react-native';

// 한 줄당 3개 이미지 + 여백 고려
const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_MARGIN = getResponsiveWidth(2); // 이미지 사이 여백
const NUM_COLUMNS = 3;
const IMAGE_SIZE =
  (SCREEN_WIDTH - IMAGE_MARGIN * (NUM_COLUMNS * 2)) / NUM_COLUMNS;

export default function ImageSelectPage() {
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState([]);
  const navigation = useNavigation();

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

  const loadPhotos = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      console.log('⛔ 권한 거절됨');
      return;
    }

    try {
      const res = await CameraRoll.getPhotos({
        first: 50,
        assetType: 'Photos',
      });

      const photoData = res.edges.map(edge => edge.node.image);
      setPhotos(photoData);
    } catch (err) {
      console.log('❌ getPhotos 실패:', err);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const toggleSelect = uri => {
    if (selected.includes(uri)) {
      setSelected(selected.filter(u => u !== uri));
    } else {
      setSelected([...selected, uri]);
    }
  };

  const handleNext = async () => {
    const convertedUris = await Promise.all(
      selected.map((uri, i) => {
        if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
          return convertPhUriToFileUri(uri, i);
        }
        if (Platform.OS === 'android' && uri.startsWith('content://')) {
          return convertContentUriToFileUri(uri, i);
        }
        return Promise.resolve(uri);
      }),
    );

    const validUris = convertedUris.filter(Boolean);
    navigation.navigate('카테고리선택화면', {selectedImages: validUris});
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle}>
          사진 선택하기 ({selected.length})
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleNext}
          style={{marginRight: getResponsiveWidth(10)}}>
          <Image
            source={require('../../../assets/images/check-bt.png')}
            style={styles.checkIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [selected]);

  const renderItem = ({item}) => {
    const isSelected = selected.includes(item.uri);
    return (
      <TouchableOpacity onPress={() => toggleSelect(item.uri)}>
        <View style={[styles.imageWrapper, isSelected && styles.selectedImage]}>
          <Image source={{uri: item.uri}} style={styles.image} />
          <View style={styles.checkCircleWrapper}>
            <View
              style={[
                styles.checkCircle,
                isSelected && styles.checkCircleSelected,
              ]}
            />
          </View>
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
        numColumns={3}
        contentContainerStyle={styles.galleryContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 3,
    borderColor: '#D3D3D3',
    paddingTop: getResponsiveHeight(2),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
  },
  checkIcon: {
    width: getResponsiveWidth(25),
    height: getResponsiveHeight(25),
    resizeMode: 'contain',
  },
  galleryContainer: {
    paddingHorizontal: getResponsiveWidth(2),
  },
  imageWrapper: {
    position: 'relative',
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: getResponsiveWidth(1),
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
  checkCircleWrapper: {
    position: 'absolute',
    top: getResponsiveHeight(3),
    right: getResponsiveWidth(3),
    width: getResponsiveWidth(20),
    height: getResponsiveHeight(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: getResponsiveWidth(14),
    height: getResponsiveHeight(14),
    borderRadius: getResponsiveWidth(7),
    borderWidth: 1,
    borderColor: '#666',
    backgroundColor: 'white',
  },
  checkCircleSelected: {
    backgroundColor: '#FFC84D',
    borderColor: '#FFC84D',
  },
});

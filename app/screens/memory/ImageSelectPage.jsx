import React, {useEffect, useState, useLayoutEffect} from 'react';
import {Dimensions} from 'react-native';

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

import {useNavigation} from '@react-navigation/native';
import { getResponsiveHeight,getResponsiveWidth } from '../../utils/responsive';
const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_SIZE = SCREEN_WIDTH / 3 - 4; // 마진 고려

export default function ImageSelectPage() {
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState([]);
  const navigation = useNavigation();

  // ✅ 권한 요청 (Android용)
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
      console.log('🔐 권한 응답:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // ✅ 사진 불러오기
  const loadPhotos = async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        console.log('⛔ 권한 거절됨');
        return;
      }

      const res = await CameraRoll.getPhotos({
        first: 50,
        assetType: 'Photos',
      });

      console.log('📸 가져온 사진:', res.edges);
      setPhotos(res.edges.map(edge => edge.node.image));
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={{fontSize: 18, textAlign: 'center'}}>
          사진 선택하기 ({selected.length})
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('카테고리선택화면', {selectedImages: selected});
          }}
          style={{marginRight: 15}}>
         <Image
            source={require('../../assets/images/check-bt.png')}
            style={{
              width: 25,
              height: 25,
              resizeMode: 'contain',
              right: getResponsiveWidth(10),
            }}
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
        <Image
          source={{uri: item.uri}}
          style={styles.image}
        />
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
    paddingTop:getResponsiveHeight(2),
  },
  galleryContainer: {
  },

  selectedImage: {
    borderWidth: 3,
    borderColor: '#FFC84D',
    // borderRadius: 4,
  },
  

  imageWrapper: {
    position: 'relative',
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  checkCircleWrapper: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 14,
    height: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
    backgroundColor: 'white',
  },
  checkCircleSelected: {
    backgroundColor: '#FFC84D', // ✅ 선택 시 색상 변경
    borderColor: '#FFC84D',
  },
  
});

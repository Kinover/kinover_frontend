// hooks/useHeaderOptions.js
import {useEffect} from 'react';
import {Text, TouchableOpacity, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';

export default function useHeaderOptions({
  isFullImageMode,
  categoryList,
  memory,
  onPressDelete,
}) {
  const navigation = useNavigation();

  useEffect(() => {
    const categoryTitle =
      categoryList.find(cat => cat.categoryId === memory.categoryId)?.title ||
      '';

    navigation.setOptions({
      headerShown: !isFullImageMode,
      headerTitle: () => (
        <Text
          style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: getResponsiveFontSize(16),
            color: 'black',
          }}>
          {categoryTitle}
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={{marginRight: getResponsiveWidth(15)}}
          onPress={onPressDelete}>
          <Image
            source={require('../assets/images/trash.png')}
            style={{
              width: getResponsiveWidth(20),
              height: getResponsiveHeight(20),
              resizeMode: 'contain',
            }}
          />
        </TouchableOpacity>
      ),
    });
  }, [isFullImageMode, categoryList, memory.categoryId, onPressDelete]);
}

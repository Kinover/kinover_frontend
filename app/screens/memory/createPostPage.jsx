import React,{useState} from 'react';
import {useLayoutEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveHeight
} from '../../utils/responsive';

export default function CreatePostPage({navigation}) {
  const [text, setText] = useState('');

  // ✅ 네비게이션 헤더 버튼
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            style={{
              fontSize: getResponsiveFontSize(20),
              textAlign: 'center',
            }}>
            글 작성하기
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (selectedCategory) {
              navigation.navigate('추억화면', {selectedCategory});
            }
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
  }, [navigation]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        multiline
        value={text}
        onChangeText={setText}
        placeholder="글로 남긴 추억은 더 생생해요.."
        placeholderTextColor="#999"
        textAlignVertical="top" // ✅ 텍스트 상단부터 시작
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
    padding: getResponsiveWidth(10),

  },
  input: {
    height:'60%',
    borderWidth: 1,
    borderColor: '#888888',
    padding: getResponsiveWidth(10),
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
  },
});

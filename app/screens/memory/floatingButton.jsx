import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { getResponsiveIconSize } from '../../utils/responsive';

export default function FloatingButton() {
  const handleClick = () => {
    alert('플로팅 버튼 클릭!');
  };

  return (
    <TouchableOpacity style={styles.floatingButton} onPress={handleClick}>
      <Image
        source={{url:'https://i.postimg.cc/XJJ85n6B/Group-1171276555-1.png'}} // 이미지 경로 수정
        style={styles.buttonImage}
      />
    </TouchableOpacity>
    
  );
}

//https://i.postimg.cc/cC1Nwg4M/Group-1171276553.jpg
const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,  // 화면 하단에서 20px 위
    right: 20,   // 화면 오른쪽에서 20px 안쪽
    zIndex: 99, // 다른 요소들 위에 보이도록
  },
  buttonImage: {
    resizeMode:'contain',
    width: getResponsiveIconSize(60),   // 버튼의 너비
    height: getResponsiveIconSize(60),  // 버튼의 높이
    borderRadius: 30, // 이미지도 원형으로 만들기
  },
});

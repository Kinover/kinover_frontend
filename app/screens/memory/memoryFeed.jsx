import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import CustomSwitch from '../../utils/customSwitch';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../utils/responsive';
import {useSelector} from 'react-redux';
import FloatingButton from '../../utils/floatingButton';
import {useNavigation} from '@react-navigation/native';

export default function MemoryFeed() {
  // const {memoryList} = useSelector(state => state.memory);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [isGalleryView, setIsGalleryView] = useState(false); // 스위치 상태 관리

  const navigation = useNavigation();
  //더미

  const memoryList = [
    {
      memoryId: 1,
      image: 'https://i.postimg.cc/2SVJQ2zf/cherryblossom.png',
      title: '2022 여의도 벚꽃 축제',
      content:
        '2022년 봄, 우리 가족이 여의도 벚꽃 축제에 다녀왔던 그 날! 🌸 벚꽃 터널 아래서 다 같이 사진 찍느라 정신없었지만, 분홍빛 꽃잎이 흩날리는 모습이 너무 예뻤어요. 😍\n\n' +
        '막내가 벚꽃 잎 잡겠다고 깡충깡충 뛰던 모습이 아직도 선해요! ㅎㅎ 엄마가 싸온 김밥이랑 떡볶이를 한강공원에서 먹으면서 다 같이 깔깔 웃었던 순간이 최고였던 거 같아요. 🌞\n\n' +
        '사진 찍을 때 바람이 살랑살랑 불어서 꽃잎이 비처럼 내렸고, 그때 우리 가족 모두 얼굴에 꽃잎을 맞으며 웃던 장면은 정말 영화 같았어요. 📸\n\n' +
        '저녁에는 근처 야시장에 들러서 군밤이랑 붕어빵도 사 먹었는데, 특히 막내가 붕어빵을 얼굴만큼 크게 한 입 베어 물던 게 너무 귀여웠어요! 🐟\n\n' +
        '걷다가 우연히 본 거리 공연에서는 아빠가 리듬을 타면서 박수를 쳤고, 엄마는 흥겨운 노래에 맞춰 어깨를 들썩였어요. 그 모습을 보면서 우리 가족이 이렇게 소소한 순간에도 함께 웃을 수 있다는 게 얼마나 행복한 일인지 다시 한 번 느꼈어요. 🎶💖\n\n' +
        '한강 위로 어둠이 내려앉기 시작할 때쯤, 강가에 앉아 야경을 바라보면서 다 같이 따뜻한 코코아를 나눠 마셨어요. 따뜻한 음료를 마시며 서로의 얼굴을 바라보던 그 순간, 말은 많지 않았지만 마음만은 꽉 채워진 기분이었어요. ☕🌃\n\n' +
        '다음에는 더 많은 사람들과 함께, 또 한 번 이렇게 아름다운 봄날을 보내고 싶어요.🌷🌸 그리고 이 기억들을 오래도록 간직해서, 시간이 흘러도 꺼내볼 때마다 웃음이 나오는 그런 추억으로 남겼으면 좋겠어요. 🫶',

      createdAt: '2025.04.20',
      user: {
        name: '엄마',
        image: 'https://picsum.photos/seed/mom/100/100',
      },
    },
    {
      memoryId: 2,
      image:
        'https://img1.daumcdn.net/thumb/R1280x0/?fname=http://t1.daumcdn.net/brunch/service/user/6WJu/image/l0czNd_v6Ce6V_qJTwV4KM00bIE.jpg',
      title: '2020 할머니 칠순잔치',
      content:
        '할머니 칠순 잔치를 다 같이 모여서 축하했던 그 날! 🎉\n\n' +
        '할머니가 케이크 자르시면서 "이 나이에 무슨 생일이야~" 하시던 모습이 아직도 생생하네요. 😊 다들 바빠서 정신없었지만, 오랜만에 모인 가족들이 한자리에 모여 웃고 떠들었던 시간이 정말 소중했어요.\n\n' +
        '삼촌이 준비한 깜짝 영상편지에 할머니가 눈물 흘리셨을 때, 우리 모두 마음이 뭉클했었죠. 💖',
      createdAt: '2025.04.15',
      user: {
        name: '아빠',
        image: 'https://picsum.photos/seed/dad/100/100',
      },
    },
    {
      memoryId: 3,
      image:
        'https://cdn.smartfn.co.kr/news/photo/202003/91570_101660_4106.jpg',
      title: '2019 중국 상하이 여행',
      content:
        '2020년 여름, 상하이로 떠났던 가족 여행! ✈️ 낮에는 와이탄을 걷고, 밤에는 동방명주 야경을 구경했어요. 🌃',
      createdAt: '2025.04.12',
      user: {
        name: '지유',
        image: 'https://picsum.photos/seed/jiyu/100/100',
      },
    },
  ];

  // 갤러리 뷰에서 여러 메모리를 렌더링
  const renderMemoryGallery = () => {
    return (
      <FlatList
        data={memoryList} // memoryList 배열을 사용
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('게시글화면', {memory: item})}>
            <Image style={styles.galleryImage} source={{uri: item.image}} />
          </TouchableOpacity>
        )}
        scrollEnabled={false}
        keyExtractor={item => item.memoryId.toString()}
        numColumns={3} // 여러 개의 이미지를 한 줄에 렌더링
        contentContainerStyle={styles.galleryContainer}
      />
    );
  };

  return (
    <View style={styles.contentElement}>
      <View style={styles.lineContainer}>
        <DropDownPicker
          open={open}
          value={value}
          items={[
            {label: '카테고리1', value: '카테고리1'},
            {label: '전체', value: '전체'},
          ]}
          dropDownContainerStyle={styles.dropDownContainer}
          dropDownDirection="BOTTOM"
          setOpen={setOpen}
          setValue={setValue}
          placeholder={'전체'}
          containerStyle={{width: getResponsiveWidth(90), zIndex: 9999}}
          style={styles.dropdown}
          textStyle={{fontSize: getResponsiveFontSize(17)}}
        />
        <View
          style={{
            width: getResponsiveWidth(80),
            height: getResponsiveHeight(35),
            justifyContent: 'center',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: getResponsiveWidth(10),
          }}>
          <TouchableOpacity onPress={() => setIsGalleryView(true)}>
            <Image
              source={
                isGalleryView
                  ? require('../../assets/images/grid_on.png')
                  : require('../../assets/images/grid_off.png')
              }
              style={styles.gallery_bt}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsGalleryView(false)}>
            <Image
              source={
                !isGalleryView
                  ? require('../../assets/images/list_on.png')
                  : require('../../assets/images/list_off.png')
              }
              style={styles.gallery_bt}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 갤러리뷰 & 리스트뷰 조건부 렌더링 */}
      {isGalleryView ? (
        renderMemoryGallery()
      ) : (
        <View style={styles.memoryContainer}>
          {memoryList.map(memory => (
            <View key={memory.memoryId}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('게시글화면', {memory: memory})
                }
                key={memory.memoryId}
                style={{
                  backgroundColor: 'white',
                }}>
                <Text style={{marginBottom: getResponsiveHeight(5)}}>
                  {memory.createdAt}
                </Text>
                <View style={styles.memoryImageContainer}>
                  <View style={{position: 'relative', flex: 1}}>
                    <Image
                      style={styles.memoryImage}
                      source={{uri: memory.image}}
                    />
                    <Text
                      style={{
                        position: 'absolute',
                        right: getResponsiveWidth(10),
                        bottom: getResponsiveHeight(20),
                        zIndex: 999,
                        fontSize: getResponsiveFontSize(18),
                        // backgroundColor: 'pink',
                        fontFamily: 'Pretendard-SemiBold',
                        color: 'white',
                      }}>
                      댓글 2
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: getResponsiveFontSize(22),
                      fontFamily: 'Pretendard-Regualr',
                      marginBottom: getResponsiveHeight(5),
                    }}>
                    {memory.title}
                  </Text>
                  <Text
                    style={{
                      fonrFamily: 'Pretendard-Light',
                      fontSize: getResponsiveFontSize(12),
                      maxHeight: getResponsiveHeight(50),
                    }}>
                    {memory.content}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.bar}></View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  galleryImage: {
    width: 125,
    height: 125,
    margin: 2,
    // borderRadius: 10,
  },

  galleryContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // paddingHorizontal:
    // backgroundColor:'black',
  },

  contentElement: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(20),
    position: 'relative',
  },

  // 메모리 전체
  memoryContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: getResponsiveHeight(30),
    paddingHorizontal: getResponsiveWidth(10),
    // backgroundColor:'lightgray',
  },

  // 멤버
  memberContainer: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: getResponsiveIconSize(5),
    backgroundColor: '#fff',
    gap: getResponsiveWidth(15),
    height: getResponsiveHeight(60),
  },

  // 멤버 text
  memberBox: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: getResponsiveIconSize(10),
    justifyContent: 'flex-start',
    width: '100%',
    height: getResponsiveHeight(40),
  },

  memberImage: {
    width: getResponsiveWidth(40),
    height: getResponsiveHeight(40),
    borderColor: 'lightgray',
    borderWidth: getResponsiveIconSize(0.7),
    borderRadius: getResponsiveIconSize(20),
    resizeMode: 'cover',
  },

  memberName: {
    fontSize: getResponsiveFontSize(14),
    marginTop: getResponsiveIconSize(5),
    marginBottom: getResponsiveIconSize(5),
  },

  memoryDescription: {
    fontSize: getResponsiveFontSize(10),
  },

  memoryImageContainer: {
    display: 'flex',
    alignSelf: 'center',
    width: '100%',
    height: getResponsiveHeight(300),
  },

  memoryImage: {
    flex: 1,
    // borderRadius: getResponsiveIconSize(15),
    resizeMode: 'cover',
    marginBottom: getResponsiveHeight(10),
  },

  dropdown: {
    fontFamily: 'Pretendard-Regular',
    width: getResponsiveWidth(80),
    borderWidth: 0,
  },

  dropDownContainer: {
    borderColor: '#FFC84D', // 테두리 색상 변경
    borderWidth: 1, // 테두리 두께 변경
    borderRadius: 5, // 모서리 둥글게
  },

  lineContainer: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(15),
  },

  switch: {
    // width:getResponsiveHeight(20),
  },

  gallery_bt: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(30),
    resizeMode: 'contain',
  },

  bar: {
    width: '120%',
    backgroundColor: '#D9D9D9',
    height: getResponsiveHeight(2),
    marginTop: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(15),
    marginLeft: -20,
  },
});

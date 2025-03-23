import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  FlatList,
  SectionList,
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

export default function MemoryFeed() {
  const {memoryList} = useSelector(state => state.memory);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [isGalleryView, setIsGalleryView] = useState(false); // 스위치 상태 관리

  // 갤러리 뷰에서 여러 메모리를 렌더링
  const renderMemoryGallery = () => {
    return (
      <FlatList
        data={memoryList} // memoryList 배열을 사용
        renderItem={({item}) => (
          <Image style={styles.galleryImage} source={{uri: item.image}} />
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
            {label: '인기순', value: '인기순'},
            {label: '댓글순', value: '댓글순'},
            {label: '최신순', value: '최신순'},
          ]}
          dropDownContainerStyle={styles.dropDownContainer}
          dropDownDirection="BOTTOM"
          setOpen={setOpen}
          setValue={setValue}
          placeholder={'최신순'}
          containerStyle={{width: getResponsiveWidth(60), zIndex: 9999}}
          style={styles.dropdown}
          textStyle={{fontSize: 15}}
        />
        <CustomSwitch
          isEnabled={isGalleryView}
          toggleSwitch={() => setIsGalleryView(!isGalleryView)}
        />
      </View>

      {/* 갤러리뷰 & 리스트뷰 조건부 렌더링 */}
      {isGalleryView ? (
        renderMemoryGallery()
      ) : (
        <View style={styles.memoryContainer}>
          {memoryList.map(memory => (
            <View key={memory.memoryId} style={{marginBottom:getResponsiveHeight(30)}}>
              <View style={styles.memberContainer}>
                <Image
                  style={styles.memberImage}
                  source={{uri: memory.user.image}}
                />
                <View style={styles.memberBox}>
                  <Text style={styles.memberName}>{memory.user.name}</Text>
                  <Text style={styles.memoryDescription}>
                    조회 1 표현 3 댓글 1
                  </Text>
                </View>
              </View>
              <View style={styles.memoryImageContainer}>
                <Image
                  style={styles.memoryImage}
                  source={{uri: memory.image}}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  galleryImage: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
  },

  galleryContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    width: getResponsiveWidth(330),
    height: getResponsiveHeight(300),
  },

  memoryImage: {
    flex: 1,
    resizeMode: 'stretch',
  },

  dropdown: {
    fontFamily: 'Pretendard-Regular',
    width: getResponsiveWidth(90),
    borderWidth: 0,
    // paddingLeft: 5, // 내부 패딩 조절
  },

  dropDownContainer: {
    borderColor: '#FFC84D', // 테두리 색상 변경
    borderWidth: 1, // 테두리 두께 변경
    borderRadius: 5, // 모서리 둥글게
    // paddingVertical: 5, // 내부 패딩 조절
    // paddingHorizontal: 5, // 내부 패딩 조절
  },

  lineContainer: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  switch: {
    // width:getResponsiveHeight(20),
  },
});

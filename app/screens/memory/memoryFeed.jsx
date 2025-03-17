import React, {useState} from 'react';
import {View, StyleSheet, Switch, Image, Text} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../utils/responsive';
import DropDownPicker from 'react-native-dropdown-picker'; // 드롭다운 패키지 임포트
import CustomSwitch from '../../utils/customSwitch';

export default function MemoryFeed({item}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false); // 상태를 관리

  const toggleSwitch = () => setIsEnabled(previousState => !previousState); // 상태 변경 함수

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
          dropDownDirection="BOTTOM" // 드롭다운 방향을 아래로 고정
          setOpen={setOpen}
          setValue={setValue}
          placeholder={'최신순'}
          containerStyle={{
            width: getResponsiveWidth(95),
            zIndex: 9999,
          }}
          style={styles.dropdown}
          scrollViewProps={{
            showsVerticalScrollIndicator: false,
          }}
          textStyle={{fontSize: getResponsiveFontSize(15)}}
        />
        <CustomSwitch></CustomSwitch>
      </View>

      {/* Memory 컴포넌트 내용 통합 */}
      <View style={styles.memoryContainer}>
        <View style={styles.memberContainer}>
          <Image
            style={styles.memberImage}
            source={{
              uri: item.user.image,
            }}></Image>
          <View style={styles.memberBox}>
            <Text style={styles.memberName}>{item.user.name}</Text>
            <Text style={styles.memoryDescription}>조회 1 표현 3 댓글 1</Text>
          </View>
        </View>

        <View style={styles.memoryImageContainer}>
          <Image
            style={styles.memoryImage}
            source={{
              uri: item.image,
            }}></Image>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentElement: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(20),
    position: 'relative',
    paddingTop: getResponsiveHeight(10),
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
    width: getResponsiveWidth(95),
    borderWidth: 0,
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

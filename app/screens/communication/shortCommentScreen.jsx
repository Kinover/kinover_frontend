import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Image, Text, TextInput} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../utils/responsive';
import {fetchFamilyUserListThunk} from '../../redux/thunk/familyUserThunk';

export default function ShortCommentScreen() {
  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const {familyUserList} = useSelector(state => state.userFamily);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [containerSize, setContainerSize] = useState({width: 0, height: 0});

  useEffect(() => {
    dispatch(fetchFamilyUserListThunk(family.familyId));
  }, [dispatch]);

  const predefinedPositions = [
    {top: '10%', left: '-15%'},
    {top: '20%', left: '90%'},
    {top: '35%', left: '0%'},
    {top: '55%', left: '80%'},
    {top: '85%', left: '50%'},
  ];

  return (
    <View
      style={styles.mainContainer}
      onLayout={event => {
        const {width, height} = event.nativeEvent.layout;
        setContainerSize({width, height});
      }}>

      {familyUserList.map((member, index) => {
        const position =
          predefinedPositions[index % predefinedPositions.length];
        const isOdd = index % 2 !== 0;
        const isCurrentUser = member.userId === user.userId;
        const isLarge = index === 0 || index === 3;

        return (
          <View key={index} style={[styles.memberContainer, position]}>
            <Image
              style={[
                styles.memberImage,
                isLarge && {
                  width: getResponsiveIconSize(80),
                  height: getResponsiveIconSize(80),
                  borderRadius: getResponsiveIconSize(40),
                },
              ]}
              source={{uri: member.image}}
            />

            <View
              style={[
                styles.memberCommentContainer,
                {left: isOdd ? '-150%' : '90%'},
                isLarge && {
                  width: getResponsiveWidth(130),
                  height: getResponsiveHeight(80),
                },
              ]}>
              <Image
                style={styles.memberComment}
                source={{
                  uri: isOdd
                    ? 'https://i.postimg.cc/022nmvsd/Group-482.png'
                    : 'https://i.postimg.cc/8CBftFdF/Group-483-1.png',
                }}
              />

              {isCurrentUser ? (
                <TextInput
                  style={styles.commentTextInput}
                  placeholder="댓글을 입력하세요"
                />
              ) : (
                <Text style={[styles.commentText, {left: '20%', top: '25%'}]}>
                  멤버 {index + 1} 코멘트
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    width: '80%',
    height: '80%',
    position: 'relative',
    marginTop: getResponsiveHeight(30),
  },

  memberContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  memberImage: {
    width: getResponsiveIconSize(64),
    height: getResponsiveIconSize(64),
    borderRadius: getResponsiveIconSize(32),
    resizeMode: 'cover',
    backgroundColor: 'white',
  },
  memberCommentContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: getResponsiveWidth(104),
    height: getResponsiveHeight(64),
    left: '80%',
    bottom: '80%',
  },
  memberComment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  commentText: {
    color: 'black',
    fontSize: getResponsiveFontSize(12),
    textAlign: 'center',
    position: 'absolute',
  },
  commentTextInput: {
    color: 'black',
    fontSize: getResponsiveFontSize(12),
    textAlign: 'center',
    position: 'absolute',
    width: '60%',
    top: '30%',
  },
});

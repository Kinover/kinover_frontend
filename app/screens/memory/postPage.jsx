import React, {useState, useEffect, useCallback, useLayoutEffect} from 'react';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import LinearGradient from 'react-native-linear-gradient';
import {
  Image,
  Text,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import CustomModal from '../../utils/customModal';
import ImageDeleteModal from '../../utils/imageDeleteModal';

export default function PostPage({route}) {
  const [isFullImageMode, setIsFullImageMode] = useState(false);
  const [commentIndex, setCommentIndex] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState('');

  const [contentHeight, setContentHeight] = useState(0);
  const [dynamicSnapPoints, setDynamicSnapPoints] = useState(['20%', '25%']);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const memory = route.params.memory;
  const navigation = useNavigation();

  const toggleFullImageMode = () => {
    setIsFullImageMode(prev => !prev);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: !isFullImageMode,
      headerRight: () => (
        <TouchableOpacity onPress={() => setShowDeleteOptions(prev => !prev)}>
          <Image
            source={require('../../assets/images/trash.png')}
            style={{
              width: getResponsiveWidth(20),
              height: getResponsiveHeight(20),
              resizeMode: 'contain',
              marginRight: getResponsiveWidth(15),
              bottom: getResponsiveHeight(5),
            }}
          />
        </TouchableOpacity>
      ),
    });
  }, [isFullImageMode, navigation]);

  const onContentLayout = useCallback(event => {
    const {height} = event.nativeEvent.layout;
    setContentHeight(height);
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={toggleFullImageMode}>
        <Image style={styles.memoryImage} source={{uri: memory.image}} />
      </TouchableWithoutFeedback>

      {!isFullImageMode && !commentIndex && (
        <View style={styles.description}>
          <TouchableWithoutFeedback>
            <View style={styles.headerContainer}>
              <View style={styles.writer}>
                <Image
                  style={styles.writerImage}
                  source={{uri: memory.user.image}}
                />
                <Text style={styles.writerName}>{memory.user.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setCommentIndex(true)}>
                <Image
                  style={styles.commentButton}
                  source={require('../../assets/images/messageBubble.png')}
                />
                <Text
                  style={{
                    position: 'absolute',
                    fontSize: getResponsiveFontSize(14.5),
                    top: getResponsiveHeight(11),
                    left: getResponsiveWidth(20),
                    color: 'gray',
                  }}>
                  2
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>

          <ScrollView
            style={styles.contentContainer}
            contentContainerStyle={{paddingBottom: '10%'}}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}>
            <Text style={styles.content} onLayout={onContentLayout}>
              {memory.content}
            </Text>
          </ScrollView>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
            style={styles.fadeOutGradient}
            pointerEvents="none"
          />
        </View>
      )}

      {!isFullImageMode && commentIndex && (
        <View style={styles.commentContainer}>
          <View style={styles.commentHeader}>
            <TouchableOpacity
              style={{
                position: 'absolute',
                height: '100%',
                width: getResponsiveWidth(50),
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex:2,
                // backgroundColor:'pink'
              }}
              onPress={() => setCommentIndex(false)}>
              <Image
                style={styles.back_bt}
                source={require('../../assets/images/backbt.png')}></Image>
            </TouchableOpacity>
            <View
              style={{
                display: 'flex',
                height: '100%',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  fontSize: getResponsiveFontSize(18),
                  fontFamily: 'Pretendard-Regular',
                }}>
                댓글
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.commentContentContainer}
            contentContainerStyle={{paddingBottom: '10%'}}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}>
            <View style={styles.commentBox}>
              <Image
                style={styles.commentWriterImage}
                source={require('../../assets/images/kino-yellow.png')}></Image>
              <View style={styles.commentTextBox}>
                <Text style={styles.commentWriter}>키노</Text>
                <Text style={styles.commentContent}>
                  이때 진짜 좋았었는데 ㅎㅎ 봄나들이 또가고 싶다
                </Text>
              </View>
              <Text style={styles.commentCreatedAt}>2025-04-25</Text>
            </View>

            <View style={styles.commentBox}>
              <Image
                style={styles.commentWriterImage}
                source={require('../../assets/images/kino-blue.png')}></Image>
              <View style={styles.commentTextBox}>
                <Text style={styles.commentWriter}>피노키노</Text>
                <Text style={styles.commentContent}>
                  으악 이때가 벌써 일년 전이라니 ㅋㅋㅋ 아 기억난다 막내가 자꾸
                  가다가 벚꽃 잡겠다고 팔짝대다가 넘어지고.. 엉엉 울고
                  그랬었는데 지난주에 벚꽃 축제 가려다가 비와가지고 못간거 ㅜㅜ
                  너무 아쉽긴 하다 내년에는 꼭 가고야 말겠어!! 근데 아직도 이
                  게시글 보는 사람이 있나? 아 야식으로 팔도 비빔면에 삼겹살 먹고
                  싶다~
                </Text>
              </View>
              <Text style={styles.commentCreatedAt}>2025-04-25</Text>
            </View>
          </ScrollView>

          <View style={styles.commentInputContainer}>
            <Image
              style={styles.commentInputImage}
              source={require('../../assets/images/kino-blue.png')}></Image>
            <TextInput
              style={styles.commentInput}
              placeholder="한마디 남기기.."
            />
            <TouchableOpacity>
              <Image
                style={styles.commentSendBt}
                source={require('../../assets/images/comment-send-bt.png')}></Image>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {deleteModalVisible && (
        <ImageDeleteModal
          visible={deleteModalVisible}
          onClose={() => setDeleteModalVisible(false)}
          onConfirm={() => {
            console.log(`${deleteTarget} 삭제!`);
            setDeleteModalVisible(false);
          }}
          closeText="취소"
          confirmText="삭제"
          closeTextStyle={{
            fontSize: getResponsiveFontSize(14),
            fontFamily: 'Pretendard-Regular',
          }}
          confirmTextStyle={{
            fontSize: getResponsiveFontSize(14),
            fontFamily: 'Pretendard-Regular',
          }}
          closeButtonStyle={{
            flex: 1,
            backgroundColor: '#E0E0E0',
            paddingVertical: getResponsiveHeight(10),
            borderRadius: 8,
          }}
          confirmButtonStyle={{
            flex: 1,
            backgroundColor: '#FFC84D',
            paddingVertical: getResponsiveHeight(10),
            borderRadius: 8,
          }}
          children={
            <Text
              style={{
                fontSize: getResponsiveFontSize(17),
                fontFamily: 'Pretendard-SemiBold',
                textAlign: 'center',
                marginTop: getResponsiveHeight(10),
                marginBottom: getResponsiveHeight(5),
              }}>
              {deleteTarget === '게시물'
                ? '게시물을 삭제하시겠습니까?'
                : '사진을 삭제하시겠습니까?'}
            </Text>
          }></ImageDeleteModal>
      )}

      {showDeleteOptions && (
        <View style={styles.deleteOptions}>
          <TouchableOpacity
            style={styles.deleteOptionButton}
            onPress={() => {
              setShowDeleteOptions(false);
              setDeleteTarget('게시물');
              setDeleteModalVisible(true);
            }}>
            <Text style={styles.deleteOptionText}>게시물 전체 삭제</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.deleteOptionButton}
            onPress={() => {
              setShowDeleteOptions(false);
              setDeleteTarget('사진');
              setDeleteModalVisible(true);
            }}>
            <Text style={styles.deleteOptionText}>이 사진만 삭제</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  memoryImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  description: {
    // flex: 1,
    width: '100%',
    height: '30%',
    alignItems: 'center',
  },
  fadeOutGradient: {
    position: 'absolute',
    bottom: 0,
    height: '30%', // 흐릿하게 사라질 영역 높이
    width: '100%',
  },

  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: getResponsiveHeight(60),
    paddingHorizontal: getResponsiveWidth(10),
  },
  writer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },
  writerImage: {
    width: getResponsiveWidth(40),
    height: getResponsiveHeight(40),
    borderRadius: getResponsiveWidth(20),
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: getResponsiveWidth(0.5),
  },
  writerName: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-Regular',
  },
  commentButton: {
    width: getResponsiveWidth(45),
    height: getResponsiveHeight(40),
    right: getResponsiveWidth(-5),
    resizeMode: 'contain',
    bottom: -5,
  },
  contentContainer: {
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    width: '100%',
    paddingHorizontal: getResponsiveWidth(10),
  },
  content: {
    color: 'black',
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(15),
    paddingVertical: getResponsiveWidth(5),
  },

  commentContainer: {
    width: '100%',
    height: '30%',
    backgroundColor: '#EDEDED',
  },

  commentHeader: {
    width: '100%',
    height: '15%',
    // backgroundColor: 'pink',
    display: 'flex',
    flexDirection: 'column',
  },

  commentContentContainer: {
    width: '100%',
    backgroundColor: '#EDEDED',
    borderTopColor: '#D3D3D3',
    borderTopWidth: 2,
    // height: '25%',
  },

  commentBox: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'row',
    // backgroundColor:'yellow',
    gap: getResponsiveWidth(10),
    paddingHorizontal: getResponsiveWidth(5),
    paddingVertical: getResponsiveWidth(5),
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  commentWriterImage: {
    width: getResponsiveWidth(40),
    height: getResponsiveHeight(40),
    borderRadius: getResponsiveHeight(20),
    // backgroundColor:'pink',
    borderColor: 'lightgray',
    borderWidth: 1,
    resizeMode: 'contain',
  },
  commentTextBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    top: getResponsiveHeight(3),
    width: '85%',
    gap: getResponsiveHeight(2),
  },
  commentWriter: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(15),
  },
  commentContent: {
    flexWrap: 'wrap',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13),
  },
  commentCreatedAt: {
    position: 'absolute',
    fontSize: getResponsiveFontSize(9),
    right: getResponsiveWidth(5),
    top: getResponsiveHeight(7.5),
    fontFamily: 'Pretendard-Light',
  },

  back_bt: {
    // position: 'absolute',
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(20),
    resizeMode: 'contain',
  },

  commentInputContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'absolute',
    width: '100%',
    height: '20%',
    backgroundColor: '#D9D9D9',
    bottom: '0',
    paddingHorizontal: getResponsiveWidth(10),
    gap: getResponsiveWidth(10),
  },
  commentInputImage: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(30),
    borderRadius: getResponsiveWidth(15),
    resizeMode: 'contain',
    backgroundColor: 'white',
    borderWidth: 0.1,
  },
  commentInput: {
    width: '80%',
    height: Platform.OS === 'android' ? '70%' : '60%',
    borderBottomWidth: 1, // 언더바 두께
  },
  commentSendBt: {
    width: getResponsiveWidth(28),
    height: getResponsiveHeight(28),
    borderRadius: getResponsiveIconSize(14),
  },

  deleteOptions: {
    position: 'absolute',
    top: getResponsiveHeight(95), // 휴지통 아래
    right: getResponsiveWidth(15),
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    borderRadius: 7,
    zIndex: 10,
    overflow: 'hidden',
  },
  deleteOptionButton: {
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(20),
  },
  deleteOptionText: {
    color: 'black',
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Light',
    textAlign: 'center',
  },
  divider: {
    height: Platform.OS === 'android' ? 0.5 : 0.2,
    backgroundColor: 'black',
  },
});

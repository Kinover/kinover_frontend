import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

export default function DescriptionSection({memory, onContentLayout}) {
  const insets = useSafeAreaInsets(); // ✅ 하단 inset 가져오기

  if (!memory) return null;

  return (
    <View>
      <TouchableWithoutFeedback>
        <View style={styles.headerContainer}>
          <View style={styles.writer}>
            <Image
              style={styles.writerImage}
              source={{uri: memory.authorImage}}
            />
            <Text style={styles.writerName}>{memory.authorName}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* ✅ SafeAreaView + paddingBottom */}
      <SafeAreaView
        edges={['bottom']}
        style={[
          styles.description,
          {paddingBottom: insets.bottom + getResponsiveHeight(10)},
        ]}>
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={{paddingBottom: getResponsiveHeight(40)}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}>
          <Text style={styles.content} onLayout={onContentLayout}>
            {memory.content}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    zIndex: 5,
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: getResponsiveHeight(60),
    paddingHorizontal: getResponsiveWidth(30),
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0)',
  },
  writer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },
  writerImage: {
    width:
      Platform.OS === 'ios' ? getResponsiveWidth(39) : getResponsiveWidth(36.5),
    height:
      Platform.OS === 'ios' ? getResponsiveWidth(39) : getResponsiveWidth(36.5),
    borderRadius: getResponsiveWidth(20),
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: getResponsiveWidth(0.25),
  },
  writerName: {
    color: 'black',
    fontSize:
      Platform.OS === 'ios'
        ? getResponsiveFontSize(18) // 🔽 21 → 18
        : getResponsiveFontSize(16), // 🔽 18 → 16
    fontFamily: 'Pretendard-Regular',
    textAlignVertical: 'center',
    lineHeight:
      Platform.OS === 'ios' ? getResponsiveHeight(26) : getResponsiveHeight(22),
  },

  content: {
    color: 'black',
    fontFamily: 'Pretendard-Light',
    fontSize:
      Platform.OS === 'ios'
        ? getResponsiveFontSize(15) // 🔽 17 → 15
        : getResponsiveFontSize(14), // 🔽 15 → 14
    lineHeight:
      Platform.OS === 'ios'
        ? getResponsiveHeight(24) // 자연스럽게 읽히는 라인 높이
        : getResponsiveHeight(22),
    paddingVertical: getResponsiveHeight(3),
    textAlignVertical: 'center',
  },

  contentContainer: {
    width: '100%',
    height: '100%',
    paddingHorizontal: getResponsiveWidth(30),
  },
});

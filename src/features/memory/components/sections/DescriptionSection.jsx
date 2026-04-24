import React from 'react';
import { View, ScrollView, TouchableWithoutFeedback, StyleSheet, Image, Platform } from 'react-native';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {FONTS} from 'styles/typography';

export default function DescriptionSection({memory, onContentLayout}) {
  const styles = useScaledStyleSheet(rf => ({

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
    paddingHorizontal: getResponsiveWidth(20),
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
        ? rf(18) // 🔽 21 → 18
        : rf(16), // 🔽 18 → 16
    fontFamily: FONTS.REGULAR,
    textAlignVertical: 'center',
    lineHeight:
      Platform.OS === 'ios' ? getResponsiveHeight(26) : getResponsiveHeight(22),
  },

  content: {
    color: 'black',
    fontFamily: FONTS.LIGHT,
    fontSize:
      Platform.OS === 'ios'
        ? rf(15) // 🔽 17 → 15
        : rf(14), // 🔽 15 → 14
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
    paddingHorizontal: getResponsiveWidth(25),
  },

  }));
  const insets = useSafeAreaInsets(); // 하단 inset 가져오기

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
            <AppText style={styles.writerName}>{memory.authorName}</AppText>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* SafeAreaView + paddingBottom */}
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
          <AppText style={styles.content} onLayout={onContentLayout}>
            {memory.content}
          </AppText>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}


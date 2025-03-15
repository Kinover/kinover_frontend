import React from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from "../../utils/responsive";

export default function MemoryFeed({ item }) {
  return (
    <View style={styles.contentElement}>
      {/* Memory 컴포넌트 내용 통합 */}
      <View style={styles.memoryContainer}>
        <View style={styles.memberContainer}>
          <Image
            style={styles.memberImage}
            source={{
              uri: item.user.image,
            }}
          ></Image>
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
            }}
          ></Image>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentElement: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(20),
  },

  // 메모리 전체
  memoryContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    width: "100%",
    marginBottom: getResponsiveHeight(30),
  },

  // 멤버
  memberContainer: {
    display: "flex",
    flexDirection: "row",
    paddingTop: getResponsiveIconSize(5),
    backgroundColor: "#fff",
    gap: getResponsiveWidth(15),
    height: getResponsiveHeight(60),
  },

  // 멤버 text
  memberBox: {
    display: "flex",
    flexDirection: "column",
    marginBottom: getResponsiveIconSize(10),
    justifyContent: "flex-start",
    width: "100%",
    height: getResponsiveHeight(40),
  },

  memberImage: {
    width: getResponsiveWidth(40),
    height: getResponsiveHeight(40),
    borderColor:'lightgray',
    borderWidth: getResponsiveIconSize(0.7),
    borderRadius:getResponsiveIconSize(20),
    resizeMode: "cover",
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
    display: "flex",
    alignSelf: "center",
    width: getResponsiveWidth(330),
    height: getResponsiveHeight(300),
  },
  memoryImage: {
    flex: 1,
    resizeMode: "stretch",
  },
});

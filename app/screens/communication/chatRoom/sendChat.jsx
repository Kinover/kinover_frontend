import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from "../../../utils/responsive";
import formatTime from "../../../utils/formatTime";

export default function SendChat({ chatTime, message, style }) {
  return (
    <View style={[styles.sendContainer, style]}>
      <Text style={styles.sendTime}>{formatTime(chatTime)}</Text>
      <View style={styles.sendBubble}>
        <Text style={styles.sendText}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** 🔹 발신 메시지 스타일 */
  sendContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end", // 오른쪽 정렬
  },

  sendBubble: {
    backgroundColor: "#FFECC3",
    borderRadius: getResponsiveIconSize(20),
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(20),
    maxWidth: getResponsiveWidth(260),
    flexShrink: 1,
    alignSelf: "flex-end",
  },

  sendText: {
    fontFamily: "Pretendard-Light",
    fontSize: getResponsiveFontSize(13),
    color: "black",
    flexWrap: "wrap",
    lineHeight: getResponsiveFontSize(18), // 줄 간격 설정
  },

  sendTime: {
    fontSize: getResponsiveFontSize(10),
    color: "#666",
    marginRight: getResponsiveWidth(5), // 말풍선 왼쪽에 위치
  },
});

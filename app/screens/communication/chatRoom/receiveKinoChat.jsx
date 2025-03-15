import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from "../../../utils/responsive";

export default function ReceiveKinoChat({ message, chatTime }) {
  return (
    <View style={styles.receivedContainer}>
      {/* 유저 이름 & 말풍선 */}
      <View style={styles.textContainer}>
        {/* 메시지 & 시간 */}
        <View style={styles.messageContainer}>
          <View style={styles.receivedBubble}>
            <Text style={styles.receivedText}>{message}</Text>
          </View>
          <Text style={styles.receivedTime}>{chatTime}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  receivedContainer: {
    flexDirection: "row",
    alignItems: "flex-start", // 프로필 이미지와 텍스트 정렬
    marginBottom: getResponsiveHeight(30),
  },

  /** 🔹 유저 이름 & 메시지 */
  textContainer: {
    flex: 1,
    flexDirection: "column",
  },

  /** 🔹 메시지 & 시간 */
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  receivedBubble: {
    backgroundColor: "#FFC84D",
    borderRadius: getResponsiveIconSize(20),
    paddingVertical: getResponsiveHeight(15),
    paddingHorizontal: getResponsiveWidth(20),
    maxWidth: "85%",
    flexShrink: 1,
  },

  receivedText: {
    fontFamily: "Pretendard-Light",
    fontSize: getResponsiveFontSize(13),
    color: "black",
    flexWrap: "wrap",
    lineHeight: getResponsiveFontSize(18), // 줄 간격 설정
  },

  receivedTime: {
    fontSize: getResponsiveFontSize(10),
    color: "#666",
    marginLeft: getResponsiveWidth(5), // 말풍선 왼쪽에 위치
  },
});

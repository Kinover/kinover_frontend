import React from "react";
import { StyleSheet, ScrollView, View, Image, Text } from "react-native";
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from "../utils/responsive";

export default function NotificationScreen() {
  return (
    <ScrollView style={styles.mainContainer}>
      <View style={styles.element}>
        <Image style={styles.elementProfile} source={{uri:"https://i.postimg.cc/HnkTS1DR/Rectangle-1.png"}}></Image>
        <View style={styles.elementTextGroup}>
          <Text style={styles.elementTitle}>추억기록</Text>
          <Text style={styles.elementDescription}>
            막내자낭 님이 감정을 추가했어요.
          </Text>
        </View>
      </View>

      <View style={styles.element}>
        <Image style={styles.elementProfile} source={{uri:"https://i.postimg.cc/HnkTS1DR/Rectangle-1.png"}}></Image>
        <View style={styles.elementTextGroup}>
          <Text style={styles.elementTitle}>추억기록</Text>
          <Text style={styles.elementDescription}>
            막내자낭 님이 감정을 추가했어요.
          </Text>
        </View>
      </View>

      <View style={styles.element}>
        <Image style={styles.elementProfile} source={{uri:"https://i.postimg.cc/HnkTS1DR/Rectangle-1.png"}}></Image>
        <View style={styles.elementTextGroup}>
          <Text style={styles.elementTitle}>추억기록</Text>
          <Text style={styles.elementDescription}>
            막내자낭 님이 감정을 추가했어요.
          </Text>
        </View>
      </View>

      <View style={styles.element}>
        <Image style={styles.elementProfile} source={{uri:"https://i.postimg.cc/HnkTS1DR/Rectangle-1.png"}}></Image>
        <View style={styles.elementTextGroup}>
          <Text style={styles.elementTitle}>추억기록</Text>
          <Text style={styles.elementDescription}>
            막내자낭 님이 감정을 추가했어요.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(20),
    backgroundColor: "white",
    paddingTop:getResponsiveHeight(20),
  },
  element: {
    width: "100%",
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(5),
    height: getResponsiveHeight(80),
  },
  elementProfile: {
    width: getResponsiveWidth(50),
    height: getResponsiveHeight(50),
    borderRadius: getResponsiveIconSize(25),
    marginRight:getResponsiveWidth(20),
    resizeMode:'contain',
  },

  elementTextGroup: {
    // width:getResponsiveWidth(40),
    display: "flex",
    flexDirection: "column",
    height: getResponsiveHeight(30),
    justifyContent: "space-between",
  },

  elementTitle: {
    fontSize: getResponsiveIconSize(10),
  },

  elementDescription: {
    fontSize: getResponsiveIconSize(12),
  },
});

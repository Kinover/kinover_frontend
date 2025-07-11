import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useMemo} from 'react';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';

export default function MemberGridSection({
  members = [],
  onUserPress,
  onAddPress,
  onlineUserIds = [],
  chunkSize = 3,
}) {
  const addButtonMember = {isAddButton: true};
  const membersWithAdd = [...members, addButtonMember];

  const chunkArray = (arr, size) => {
    return Array.from({length: Math.ceil(arr.length / size)}, (_, i) =>
      arr.slice(i * size, i * size + size),
    );
  };
  const chunkedRows = useMemo(
    () => chunkArray(membersWithAdd, chunkSize),
    [membersWithAdd],
  );

  const renderUser = (member, index) => {
    if (member.isAddButton) return null; // 버튼은 따로 렌더

    const isOnline = onlineUserIds.includes(member.userId);

    return (
      <TouchableOpacity
        key={index}
        style={styles.user}
        onPress={() => onUserPress(member)}>
        <Image source={{uri: member.image}} style={styles.userImage} />
        {<View style={styles.onlineDot} />}
        <Text style={styles.userName}>{member.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.bodyContainer}>
      {Array.isArray(chunkedRows) &&
        chunkedRows.map((row, idx) => (
          <View key={idx} style={styles.bodyContainerRow}>
            {row.map(renderUser)}
          </View>
        ))}

      <TouchableOpacity onPress={onAddPress} style={styles.addButton}>
        <Text style={styles.addButtonText}>가족 추가하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bodyContainer: {
    backgroundColor: 'white',
    borderRadius: getResponsiveIconSize(10),
    paddingHorizontal: getResponsiveWidth(20),
    paddingVertical: getResponsiveHeight(30),
    paddingBottom: getResponsiveHeight(80),
    marginHorizontal: getResponsiveWidth(25),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 2,
    gap: getResponsiveHeight(30),
  },
  bodyContainerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 또는 'center'
    flexWrap: 'wrap',
    rowGap: getResponsiveHeight(25),
  },
  user: {
    position: 'relative',
    flex: 1 / 3,
    width: '33.33%',
    alignItems: 'center',
  },
  userImage: {
    width: getResponsiveIconSize(74),
    height: getResponsiveIconSize(74),
    borderRadius: getResponsiveIconSize(37),
    marginBottom: getResponsiveHeight(10),
  },
  userName: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: 'black',
  },
  addButton: {
    position: 'absolute',
    width: '100%',
    height: '20%',
    bottom: getResponsiveHeight(15),
    alignSelf: 'center',
    backgroundColor: '#FFC84D',
    borderRadius: getResponsiveIconSize(10),
    justifyContent: 'center',
  },
  addButtonText: {
    alignSelf: 'center',
    color: 'white',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(15),
  },
  onlineDot: {
    position: 'absolute',
    top: getResponsiveHeight(5),
    right: getResponsiveWidth(11), // 🔧 조금 더 안쪽으로
    width: getResponsiveWidth(16),
    height: getResponsiveWidth(16),
    borderRadius: getResponsiveWidth(8),
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: '#2CC22E',
  },
});

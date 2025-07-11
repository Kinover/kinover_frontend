import React from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {BottomSheetView} from '@gorhom/bottom-sheet';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../utils/responsive';

export default function ScheduleEditorBottomSheet({
  editingSchedule,
  familyUserList,
  selectedUserId,
  setSelectedUserId,
  title,
  setTitle,
  onSubmit,
  onDelete,
  onCancelEdit, // ✅ 추가
  onCloseSheet,
}) {
  return (
    <BottomSheetView style={{paddingHorizontal: 20}}>
      <View style={styles.titleRow}>
        <Text style={styles.sheetTitle}>
          {editingSchedule ? '일정 수정' : '일정 추가'}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: getResponsiveWidth(10),
          }}>
          {editingSchedule && (
            <TouchableOpacity onPress={onCancelEdit}>
              <Image
                source={require('../../assets/images/back_.png')}
                style={styles.cancelIcon}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onCloseSheet}>
            <Image
              source={require('../../assets/images/close-yellow.png')}
              style={styles.exitIcon}></Image>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.subTitle}>유저 선택</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{marginBottom: 20}}>
        {/* 공동 일정용 "전체" 선택 버튼 */}
        <TouchableOpacity
          onPress={() => setSelectedUserId(null)}
          style={{
            alignItems: 'center',
            marginRight: 12,
            padding: 6,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: selectedUserId === null ? '#FFC84D' : '#E0E0E0',
            backgroundColor: selectedUserId === null ? '#FFF5D1' : 'white',
            width: 60,
            height: 80,
            justifyContent: 'center',
          }}>
          <Text
            style={{
              fontSize: getResponsiveFontSize(11),
              fontFamily: 'Pretendard-Regular',
            }}>
            전체
          </Text>
        </TouchableOpacity>

        {/* 각 가족 구성원 */}
        {familyUserList.map(user => (
          <TouchableOpacity
            key={user.userId}
            onPress={() => setSelectedUserId(user.userId)}
            style={{
              alignItems: 'center',
              marginRight: 12,
              padding: 6,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor:
                selectedUserId === user.userId ? '#FFC84D' : '#E0E0E0',
              backgroundColor:
                selectedUserId === user.userId ? '#FFF5D1' : 'white',
            }}>
            <Image
              source={{uri: user.image}}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                marginBottom: 6,
              }}
            />
            <Text
              style={{
                fontSize: getResponsiveFontSize(11),
                fontFamily: 'Pretendard-Regular',
              }}>
              {user.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.subTitle}>일정 내용</Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="제목을 입력하세요"
        placeholderTextColor="#BDBDBD"
        style={styles.input}
      />

      <View style={styles.buttonRow}>
        {editingSchedule && (
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={onDelete}>
            <Text style={styles.buttonText}>삭제</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={onSubmit}>
          <Text style={[styles.buttonText, {color: 'white'}]}>저장</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetView>
  );
}

const styles = StyleSheet.create({
  sheetTitle: {
    fontSize: getResponsiveFontSize(23),
    fontFamily: 'Pretendard-SemiBold',
    color: '#333',
  },
  titleRow: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelIcon: {
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(18),
    resizeMode: 'contain',
  },
  exitIcon: {
    width: getResponsiveIconSize(15),
    hegiht: getResponsiveIconSize(13),
    resizeMode: 'contain',
  },

  input: {
    borderRadius: 12,
    padding: 13,
    backgroundColor: '#EDEDED',
    fontFamily: 'Pretendard-Regular',
    marginBottom: 20,
    fontSize: getResponsiveFontSize(13),
    color: '#212121',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 13,
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(12),
  },
  deleteButton: {
    backgroundColor: '#F2F2F2',
  },
  saveButton: {
    backgroundColor: '#FFC84D',
  },
  buttonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(15),
    alignSelf: 'center',
  },
  subTitle: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: '#9D9D9D',
    marginBottom: getResponsiveHeight(10),
  },
});

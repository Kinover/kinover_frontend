import React, {useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {getResponsiveHeight, getResponsiveWidth} from '../../utils/responsive';
import Schedule from './schedule';
import Calendar from './header';
import {SafeAreaView} from 'react-native-safe-area-context';
import CustomModal from '../../utils/customModal';
import CategoryModal from '../../utils/categoryModal';

export default function ScheduleScreen({navigation}) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: 'white'}}
      edges={['bottom']}>
      <ScrollView
        style={styles.mainContainer}
        showsVerticalScrollIndicator={false}>
        <Calendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        {/* 일정 */}
        <Schedule selectedDate={selectedDate} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: getResponsiveWidth(20),
    // paddingTop: getResponsiveHeight(10),
    // marginBottom: getResponsiveHeight(15),
  },
});

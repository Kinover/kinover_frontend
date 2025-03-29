import React,{useState} from 'react';
import {
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';
import Schedule from './schedule';
import Calendar from './header';

export default function ScheduleScreen({navigation}) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <ScrollView style={styles.mainContainer}>
      <Calendar selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>

      {/* 일정 */}
      <Schedule selectedDate={selectedDate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: getResponsiveWidth(20),
    paddingVertical: getResponsiveHeight(20),
  },
})
// src/features/magazine/screens/BookShelfScreen.jsx
/* eslint-disable react-native/no-inline-styles */
import React, {useMemo, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
} from '../../../utils/responsive';
import {BACKGROUND_COLORS} from 'styles/style';

const TEXT = '#1A1A1A';
const SUB = '#8D8D8D';
const BORDER = '#EFE6D8';

/**
 * ✅ 주간 키 포맷: "YYYY-Www" (ISO week 느낌으로 사용)
 * 예: "2026-W01", "2026-W02" ...
 */
const DUMMY_BOOKS = [
  {
    id: '2026-W10',
    weekKey: '2026-W10',
    title: '2026년 10주차',
    subtitle: '우리 가족의 주간 기록',
    coverUrl: 'https://picsum.photos/600/800?random=41',
  },
  {
    id: '2026-W09',
    weekKey: '2026-W09',
    title: '2026년 9주차',
    subtitle: '이번 주의 소소한 순간들',
    coverUrl: 'https://picsum.photos/600/800?random=42',
  },
  {
    id: '2026-W08',
    weekKey: '2026-W08',
    title: '2026년 8주차',
    subtitle: '우리 집 분위기 요약',
    coverUrl: 'https://picsum.photos/600/800?random=43',
  },
  {
    id: '2026-W07',
    weekKey: '2026-W07',
    title: '2026년 7주차',
    subtitle: '주간 하이라이트',
    coverUrl: 'https://picsum.photos/600/800?random=44',
  },
  {
    id: '2026-W06',
    weekKey: '2026-W06',
    title: '2026년 6주차',
    subtitle: '웃었던 순간들',
    coverUrl: 'https://picsum.photos/600/800?random=45',
  },
  {
    id: '2025-W52',
    weekKey: '2025-W52',
    title: '2025년 52주차',
    subtitle: '연말 주간 모음',
    coverUrl: 'https://picsum.photos/600/800?random=46',
  },
];

function getYearFromWeekKey(weekKey) {
  const y = String(weekKey || '').split('-')[0];
  return y || '기타';
}

function parseWeekNo(weekKey) {
  // "2026-W10" -> 10
  const parts = String(weekKey || '').split('-');
  const w = (parts[1] || '').replace('W', '');
  const n = Number(w);
  return Number.isFinite(n) ? n : 0;
}

function weekPillLabel(weekKey) {
  // "W10" -> "10주차"
  const n = parseWeekNo(weekKey);
  return n ? `${n}주차` : '주간';
}

function compareWeekKey(a, b) {
  // 내림차순(최신): 2026-W10 > 2026-W09
  const ay = Number(String(a).split('-')[0] || 0);
  const by = Number(String(b).split('-')[0] || 0);
  if (ay !== by) return ay - by;
  return parseWeekNo(a) - parseWeekNo(b);
}

export default function BookShelfScreen() {
  const navigation = useNavigation();
  const [sort, setSort] = useState('latest'); // latest | old

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  const sectionAnimMap = useRef(new Map()).current;

  const onPressBook = useCallback(
    book => {
      navigation.navigate('매거진상세화면', {
        // ✅ 월 키 대신 주 키로 전달
        weekKey: book.weekKey,
        book,
      });
    },
    [navigation],
  );

  const yearSections = useMemo(() => {
    const grouped = new Map();

    for (const b of DUMMY_BOOKS) {
      const year = getYearFromWeekKey(b.weekKey);
      if (!grouped.has(year)) grouped.set(year, []);
      grouped.get(year).push(b);
    }

    const sortBooks = arr =>
      arr.sort((a, b) => {
        const cmp = compareWeekKey(a.weekKey, b.weekKey);
        return sort === 'old' ? cmp : -cmp;
      });

    const years = Array.from(grouped.keys()).sort((a, b) => {
      const cmp = Number(a) - Number(b);
      return sort === 'old' ? cmp : -cmp;
    });

    return years.map(year => {
      const books = sortBooks(grouped.get(year));
      return {
        id: String(year),
        year: String(year),
        books,
        count: books.length,
      };
    });
  }, [sort]);

  const playIntro = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(10);

    yearSections.forEach(sec => {
      if (!sectionAnimMap.has(sec.id)) {
        sectionAnimMap.set(sec.id, new Animated.Value(0));
      } else {
        sectionAnimMap.get(sec.id).setValue(0);
      }
    });

    const sectionAnims = yearSections
      .map(sec => sectionAnimMap.get(sec.id))
      .filter(Boolean)
      .map(v =>
        Animated.timing(v, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      );

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.stagger(150, sectionAnims),
    ]).start();
  }, [fadeAnim, slideAnim, yearSections, sectionAnimMap]);

  useFocusEffect(
    useCallback(() => {
      playIntro();
    }, [playIntro]),
  );

  const GAP = getResponsiveWidth(12);
  const CARD_W = getResponsiveWidth(150);
  const CARD_ASPECT = 3 / 4;

  const renderWeekCard = useCallback(
    ({item}) => (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPressBook(item)}
        style={[styles.card, {width: CARD_W}]}>
        <View style={[styles.coverWrap, {aspectRatio: CARD_ASPECT}]}>
          <FastImage
            source={{uri: item.coverUrl}}
            style={styles.cover}
            resizeMode={FastImage.resizeMode.cover}
          />
          <View style={styles.coverShade} />
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>🗓️</Text>
          </View>

          <View style={styles.weekPill}>
            <Text style={styles.weekPillText}>
              {weekPillLabel(item.weekKey)}
            </Text>
          </View>
        </View>

        <View style={styles.cardTextArea}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {item.title}
          </Text>
          <Text numberOfLines={1} style={styles.cardSub}>
            {item.subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [onPressBook, CARD_W],
  );

  const renderYearSection = useCallback(
    ({item}) => {
      const section = item;

      if (!sectionAnimMap.has(section.id)) {
        sectionAnimMap.set(section.id, new Animated.Value(1));
      }
      const v = sectionAnimMap.get(section.id);

      return (
        <Animated.View
          style={[
            styles.yearSection,
            {
              opacity: v,
              transform: [
                {
                  translateY: v.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.yearRow}>
            <View style={styles.yearLeft}>
              <Text style={styles.yearText}>{section.year}</Text>
              <Text style={styles.yearCount}>({section.count})</Text>
            </View>

            <Text style={styles.yearHint}>좌우로 넘겨서 주차별로 보기</Text>
          </View>

          <FlatList
            data={section.books}
            keyExtractor={b => b.id}
            renderItem={renderWeekCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingRight: getResponsiveWidth(2)}}
            ItemSeparatorComponent={() => <View style={{width: GAP}} />}
          />
        </Animated.View>
      );
    },
    [renderWeekCard, GAP, sectionAnimMap],
  );

  return (
    <View style={styles.container}>
      <View style={{width: '100%', alignItems: 'center'}}>
        <Text style={styles.title}>우리 가족 주간 매거진</Text>
        <Text style={styles.subTitle}>매주 한 권씩, 기록이 쌓이는 책장</Text>
      </View>

      <Animated.View
        style={{
          width: '100%',
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        }}>
        <View style={styles.topArea}>
          <View />
          <View style={styles.topRight}>
            <TouchableOpacity
              onPress={() => setSort(v => (v === 'latest' ? 'old' : 'latest'))}
              activeOpacity={0.85}
              style={styles.filterBtn}>
              <Text style={styles.filterText}>
                {sort === 'latest' ? '최신순' : '오래된순'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={yearSections}
          keyExtractor={v => v.id}
          renderItem={renderYearSection}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: getResponsiveHeight(8),
            paddingBottom: getResponsiveHeight(40),
          }}
          ItemSeparatorComponent={() => (
            <View style={{height: getResponsiveHeight(18)}} />
          )}
          ListEmptyComponent={
            <View style={{paddingTop: getResponsiveHeight(80)}}>
              <Text style={styles.empty}>아직 쌓인 주간 매거진이 없어요</Text>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: getResponsiveHeight(35),
    backgroundColor: BACKGROUND_COLORS.secondaryBg,
    paddingBottom: getResponsiveHeight(140),
  },

  title: {
    paddingHorizontal: getResponsiveWidth(20),
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-SemiBold',
    color: 'black',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(6),
  },

  subTitle: {
    paddingHorizontal: getResponsiveWidth(20),
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Light',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(18),
  },

  topArea: {
    paddingHorizontal: getResponsiveWidth(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: getResponsiveHeight(4),
    marginBottom: getResponsiveHeight(12),
  },

  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },

  filterBtn: {
    paddingVertical: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFF',
  },
  filterText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: TEXT,
  },

  yearSection: {
    gap: getResponsiveHeight(10),
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveWidth(20),
  },

  yearLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: getResponsiveWidth(6),
  },

  yearText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    color: TEXT,
  },

  yearCount: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: '#9CA3AF',
    paddingBottom: getResponsiveHeight(1),
  },

  yearHint: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Regular',
    color: '#9CA3AF',
  },

  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: BORDER,
    marginLeft: getResponsiveWidth(20),
    marginRight: -getResponsiveWidth(20),
  },

  coverWrap: {width: '100%', backgroundColor: '#EEE'},
  cover: {width: '100%', height: '100%'},
  coverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  coverBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBadgeText: {fontSize: 14},

  // ✅ monthPill -> weekPill
  weekPill: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  weekPillText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-SemiBold',
  },

  cardTextArea: {paddingHorizontal: 12, paddingVertical: 12},
  cardTitle: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-SemiBold',
    color: TEXT,
  },
  cardSub: {
    marginTop: 4,
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: SUB,
  },

  empty: {
    textAlign: 'center',
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Medium',
    color: SUB,
  },
});

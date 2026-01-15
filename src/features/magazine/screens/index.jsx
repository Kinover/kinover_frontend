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
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import {BACKGROUND_COLORS, COLORS, LAYOUT_STYLE} from 'styles/style';

const TEXT = '#1A1A1A';
const SUB = '#8D8D8D';
const BORDER = '#EFE6D8';

// ✅ 검색창 테두리(사진처럼 진하게)
const SEARCH_BORDER = '#1F2A44';

const SORT_OPTIONS = [
  {key: 'latest', label: '최신순'},
  {key: 'old', label: '오래된순'},
];

/**
 * ✅ 주간 키 포맷: "YYYY-Www"
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
  return String(weekKey || '').split('-')[0] || '기타';
}

function parseWeekNo(weekKey) {
  const w = String(weekKey || '')
    .split('-')[1]
    ?.replace('W', '');
  return Number(w) || 0;
}

function weekPillLabel(weekKey) {
  const n = parseWeekNo(weekKey);
  return n ? `${n}주차` : '주간';
}

function compareWeekKey(a, b) {
  const ay = Number(a.split('-')[0]);
  const by = Number(b.split('-')[0]);
  if (ay !== by) return ay - by;
  return parseWeekNo(a) - parseWeekNo(b);
}

// ✅ 검색 필터(타이틀/서브타이틀/주차키)
function matchQuery(book, q) {
  if (!q) return true;
  const query = String(q).trim().toLowerCase();
  if (!query) return true;

  const hay = `${book.title || ''} ${book.subtitle || ''} ${book.weekKey || ''}`
    .toLowerCase()
    .replace(/\s+/g, ' ');

  return hay.includes(query);
}

export default function BookShelfScreen() {
  const navigation = useNavigation();

  // ✅ 정렬: latest | old | period(추후 기간 UI 붙이기 용)
  const [sort, setSort] = useState('latest');

  // ✅ 드롭다운 오픈
  const [sortOpen, setSortOpen] = useState(false);

  // ✅ 검색어
  const [query, setQuery] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const sectionAnimMap = useRef(new Map()).current;

  const onPressBook = useCallback(
    book => {
      navigation.navigate('매거진상세화면', {
        weekKey: book.weekKey,
        book,
      });
    },
    [navigation],
  );

  const activeSortLabel = useMemo(() => {
    return SORT_OPTIONS.find(v => v.key === sort)?.label ?? '최신순';
  }, [sort]);

  const yearSections = useMemo(() => {
    // ✅ 1) 검색 필터 먼저
    const filtered = DUMMY_BOOKS.filter(b => matchQuery(b, query));

    // ✅ 2) 연도별 그룹핑
    const grouped = new Map();
    for (const b of filtered) {
      const year = getYearFromWeekKey(b.weekKey);
      if (!grouped.has(year)) grouped.set(year, []);
      grouped.get(year).push(b);
    }

    // ✅ 3) 연도 정렬 (period는 당장 latest처럼 취급)
    const effectiveSort = sort === 'period' ? 'latest' : sort;

    const years = Array.from(grouped.keys()).sort((a, b) =>
      effectiveSort === 'old' ? Number(a) - Number(b) : Number(b) - Number(a),
    );

    return years.map(year => {
      const books = grouped
        .get(year)
        .sort((a, b) =>
          effectiveSort === 'old'
            ? compareWeekKey(a.weekKey, b.weekKey)
            : -compareWeekKey(a.weekKey, b.weekKey),
        );

      return {
        id: year,
        year,
        books,
        count: books.length,
      };
    });
  }, [sort, query]);

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
      Animated.stagger(
        150,
        yearSections.map(sec =>
          Animated.timing(sectionAnimMap.get(sec.id), {
            toValue: 1,
            duration: 650,
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();
  }, [fadeAnim, slideAnim, yearSections, sectionAnimMap]);

  useFocusEffect(useCallback(playIntro, [playIntro]));

  const GAP = getResponsiveWidth(12);
  const CARD_W = getResponsiveWidth(150);
  const CARD_ASPECT = 3 / 4;

  const onSelectSort = useCallback(key => {
    setSort(key);
    setSortOpen(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>추억 보관함</Text>
        <Text style={styles.subTitle}>
          우리의 기록이 책처럼 차곡차곡 쌓이는 곳
        </Text>
      </View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        }}>
        {/* ✅ 사진처럼: pill 검색창(드롭다운 + 인풋 + 돋보기) */}
        <View style={styles.searchWrap}>
          {/* 왼쪽: 정렬 드롭다운 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSortOpen(v => !v)}
            style={styles.sortChip}>
            <Text style={styles.sortChipText}>{activeSortLabel}</Text>
            <FastImage
              style={{
                marginLeft: getResponsiveWidth(4),
                width: getResponsiveWidth(14),
                height: getResponsiveHeight(14),
              }}
              source={require('../../../assets/icons/down-arrow.png')}
            />
          </TouchableOpacity>

          {/* 가운데: 입력 */}
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="보고 싶은 매거진 검색하기"
            placeholderTextColor={COLORS.textTertiary}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {/* 오른쪽: 돋보기 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {}}
            style={styles.searchIconBtn}>
            <FastImage
              style={{
                marginLeft: getResponsiveWidth(4),
                width: getResponsiveIconSize(18),
                height: getResponsiveIconSize(18),
              }}
              resizeMode="contain"
              source={require('../../../assets/icons/searchButton_big.png')}
            />
          </TouchableOpacity>
        </View>

        {/* ✅ 드롭다운 메뉴 (사진처럼 검색창 아래 왼쪽에 뜨게) */}
        <Modal
          visible={sortOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setSortOpen(false)}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSortOpen(false)}>
            <Pressable style={styles.sortDropdown} onPress={() => {}}>
              {SORT_OPTIONS.map(opt => {
                const active = opt.key === sort;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    activeOpacity={0.85}
                    onPress={() => onSelectSort(opt.key)}
                    style={[
                      styles.sortItem,
                      active && {backgroundColor: 'rgba(31,42,68,0.06)'},
                    ]}>
                    <Text
                      style={[
                        styles.sortItemText,
                        active && {
                          color: SEARCH_BORDER,
                          fontFamily: 'Pretendard-SemiBold',
                        },
                      ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>

        <FlatList
          data={yearSections}
          keyExtractor={v => v.id}
          renderItem={({item}) => (
            <View style={styles.yearSection}>
              <View style={styles.yearRow}>
                <View style={styles.yearLeft}>
                  <Text style={styles.yearText}>{item.year}</Text>
                  <Text style={styles.yearCount}>({item.count})</Text>
                </View>
                <Text style={styles.yearHint}>좌우로 넘겨서 주차별로 보기</Text>
              </View>

              <FlatList
                data={item.books}
                keyExtractor={b => b.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{width: GAP}} />}
                renderItem={({item: book}) => (
                  <TouchableOpacity
                    onPress={() => onPressBook(book)}
                    style={[styles.card, {width: CARD_W}]}>
                    <View
                      style={[styles.coverWrap, {aspectRatio: CARD_ASPECT}]}>
                      <FastImage
                        source={{uri: book.coverUrl}}
                        style={styles.cover}
                      />
                      <View style={styles.weekPill}>
                        <Text style={styles.weekPillText}>
                          {weekPillLabel(book.weekKey)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardTextArea}>
                      <Text numberOfLines={1} style={styles.cardTitle}>
                        {book.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.cardSub}>
                        {book.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
              <Text style={styles.emptySub}>
                다른 키워드로 다시 찾아볼까? 🫳
              </Text>
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
    paddingBottom: getResponsiveHeight(140),
    backgroundColor: BACKGROUND_COLORS.secondaryBg,
  },

  header: {
    paddingHorizontal: LAYOUT_STYLE.screenPaddingHorizontal,
    alignItems: 'center',
  },

  title: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-SemiBold',
    color: TEXT,
    marginBottom: getResponsiveHeight(6),
  },

  subTitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Light',
    color: '#6B7280',
    marginBottom: getResponsiveHeight(18),
  },

  /* ✅ 검색창 */
  searchWrap: {
    marginHorizontal: LAYOUT_STYLE.screenPaddingHorizontal,
    height: getResponsiveHeight(44),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SEARCH_BORDER,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: getResponsiveWidth(10),
    paddingRight: getResponsiveWidth(8),
    marginBottom: getResponsiveHeight(14),
  },

  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(10),
    height: getResponsiveHeight(30),
    borderRadius: 999,
    // borderWidth: 1,
    // borderColor: SEARCH_BORDER,
    backgroundColor: '#fff',
    marginRight: getResponsiveWidth(10),
  },

  sortChipText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Medium',
    color: SEARCH_BORDER,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    color: TEXT,
  },

  searchIconBtn: {
    width: getResponsiveWidth(34),
    height: getResponsiveHeight(34),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ✅ 드롭다운 */
  modalBackdrop: {
    flex: 1,
  },

  sortDropdown: {
    position: 'absolute',
    left: LAYOUT_STYLE.screenPaddingHorizontal,
    // 검색창 아래로 적당히 내려오기
    top:
      getResponsiveHeight(175) +
      getResponsiveHeight(20) +
      getResponsiveHeight(44) +
      getResponsiveHeight(8),
    width: getResponsiveWidth(90),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SEARCH_BORDER,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  sortItem: {
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(12),
  },

  sortItemText: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: TEXT,
  },

  yearSection: {
    gap: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(18),
  },

  yearRow: {
    paddingHorizontal: LAYOUT_STYLE.screenPaddingHorizontal,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  yearLeft: {
    flexDirection: 'row',
    gap: getResponsiveWidth(6),
  },

  yearText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    color: TEXT,
  },

  yearCount: {
    fontSize: getResponsiveFontSize(12.5),
    color: COLORS.textTertiary,
  },

  yearHint: {
    fontSize: getResponsiveFontSize(11.5),
    color: COLORS.textTertiary,
  },

  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: BORDER,
    marginLeft: LAYOUT_STYLE.screenPaddingHorizontal,
    marginRight: -LAYOUT_STYLE.screenPaddingHorizontal,
  },

  coverWrap: {backgroundColor: '#EEE'},
  cover: {width: '100%', height: '100%'},

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

  cardTextArea: {padding: 12},
  cardTitle: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-SemiBold',
    color: TEXT,
  },
  cardSub: {
    marginTop: 4,
    fontSize: getResponsiveFontSize(12),
    color: SUB,
  },

  /* ✅ empty */
  emptyWrap: {
    paddingTop: getResponsiveHeight(40),
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: TEXT,
  },
  emptySub: {
    marginTop: getResponsiveHeight(6),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
  },
});

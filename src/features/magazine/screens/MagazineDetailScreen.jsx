// src/features/magazine/screens/MagazineDetailScreen.jsx
/* eslint-disable react-native/no-inline-styles */

/**
 * ✅ "우리 앱(Kinover) 주간 가족 매거진" 버전 (주간 구성)
 * + ✅ 스크롤 진행도 기반 상단 바(StoryProgress) 실시간 변화
 * + ✅ 페이지 흐름에 따라 배경 틴트가 자연스럽게 변함(시간 흐름 느낌)
 */

import React, {useMemo, useRef, useState, useCallback, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
} from '../../../utils/responsive';
import {SafeAreaView} from 'react-native-safe-area-context';

const {width: W, height: H} = Dimensions.get('window');

/* ================== KINOVER THEME ================== */
const WHITE = '#FFFFFF';
const BLACK = '#0B0F14';
const NAVY = '#0D1B2A';
const SURFACE = 'rgba(255,255,255,0.06)';
const SURFACE2 = 'rgba(255,255,255,0.10)';
const LINE = 'rgba(255,255,255,0.14)';
const SUB = 'rgba(255,255,255,0.82)';
const MUTED = 'rgba(255,255,255,0.62)';

const KINO_YELLOW = '#FFD84D';
const KINO_PINK = '#FF5FA2';
const KINO_BLUE = '#59A7FF';
const KINO_GREEN = '#42D39C';

/* ================== STATE ICONS (local assets) ================== */
// ⚠️ require 경로는 "이 파일 기준"으로 상대경로
// src/features/magazine/screens -> (../../../../) -> project root -> assets/...
const STATE_ICONS = {
  annoyed: require('../../../assets/icons/state_v2/annoyed.png'),
  anxious: require('../../../assets/icons/state_v2/anxious.png'),
  depressed: require('../../../assets/icons/state_v2/depressed.png'),
  excited: require('../../../assets/icons/state_v2/excited.png'),
  exhausted: require('../../../assets/icons/state_v2/exhausted.png'),
  happy: require('../../../assets/icons/state_v2/happy.png'),
  neutral: require('../../../assets/icons/state_v2/neutral.png'),
  sorry: require('../../../assets/icons/state_v2/sorry.png'),
};

const toStateKey = v => {
  const s = String(v || '')
    .trim()
    .toLowerCase();
  return STATE_ICONS[s] ? s : 'neutral';
};

const StateIcon = memo(function StateIcon({state, size = 18, style}) {
  const key = toStateKey(state);
  return (
    <Image
      source={STATE_ICONS[key]}
      style={[{width: size, height: size}, style]}
      resizeMode="contain"
    />
  );
});

/* ================== DUMMY DATA (주간) ================== */
function buildDummyWeeklyMagazine(weekKey = '2026-01-05~2026-01-11') {
  const coverUrl = `https://picsum.photos/1200/1600?random=701`;

  return {
    weekKey,
    title: '2026.01 2주차',
    subtitle: '우리 가족의 한 주를 한 권으로',
    coverUrl,

    oneLiner: '각자 바빴지만, 밤마다 연결되어 있었던 한 주였어요.',

    highlights: [
      {label: '피크 타임', value: '밤 9~11시', color: KINO_YELLOW},
      {label: '이번 주 무드', value: '편안함', color: KINO_PINK},
      {label: '대화 폭발', value: '수요일', color: KINO_GREEN},
      {label: '업로드', value: '사진 9장', color: KINO_BLUE},
    ],

    members: [
      {
        userId: 'u1',
        name: '지윤',
        avatarUrl: null,
        activeDays: 6,
        lastActive: '어제 22:14',
        moodState: 'happy',
        moodTrend: [
          'neutral',
          'neutral',
          'happy',
          'happy',
          'neutral',
          'happy',
          'exhausted',
        ],
      },
      {
        userId: 'u2',
        name: '엄마',
        avatarUrl: null,
        activeDays: 5,
        lastActive: '오늘 08:31',
        moodState: 'neutral',
        moodTrend: [
          'neutral',
          'neutral',
          'neutral',
          'happy',
          'neutral',
          'neutral',
          'neutral',
        ],
      },
      {
        userId: 'u3',
        name: '아빠',
        avatarUrl: null,
        activeDays: 3,
        lastActive: '3일 전 19:05',
        moodState: 'exhausted',
        moodTrend: [
          'exhausted',
          'exhausted',
          'neutral',
          'exhausted',
          'exhausted',
          'exhausted',
          'exhausted',
        ],
      },
      {
        userId: 'u4',
        name: '동생',
        avatarUrl: null,
        activeDays: 2,
        lastActive: '5일 전 23:40',
        moodState: 'annoyed',
        moodTrend: [
          'annoyed',
          'annoyed',
          'neutral',
          'annoyed',
          'annoyed',
          'neutral',
          'annoyed',
        ],
      },
    ],

    mood: {
      familyMainText: '편안함',
      familyMainState: 'happy',
      trend: [
        {day: '월', state: 'neutral'},
        {day: '화', state: 'neutral'},
        {day: '수', state: 'happy'},
        {day: '목', state: 'exhausted'},
        {day: '금', state: 'neutral'},
        {day: '토', state: 'happy'},
        {day: '일', state: 'exhausted'},
      ],
    },

    chat: {
      totalMessages: 238,
      daily: [
        {day: '월', count: 26},
        {day: '화', count: 31},
        {day: '수', count: 58},
        {day: '목', count: 34},
        {day: '금', count: 29},
        {day: '토', count: 37},
        {day: '일', count: 23},
      ],
      peakDayLabel: '수요일',
      topSpeaker: '엄마',
      keywords: [
        {word: '밥', count: 22},
        {word: '사진', count: 14},
        {word: '주말', count: 12},
        {word: '추워', count: 9},
        {word: '일정', count: 8},
      ],
      timeHeat: [
        {slot: '아침', pct: 38, label: '적당'},
        {slot: '점심', pct: 22, label: '적음'},
        {slot: '저녁', pct: 66, label: '많음'},
        {slot: '밤', pct: 88, label: '최고'},
      ],
    },

    calendar: {
      busiestDayLabel: '목요일',
      overlapDays: 2,
      timeline: [
        {
          date: '01.06(화)',
          title: '엄마 병원',
          note: '오전 10시 / 정기검진',
          type: 'HEALTH',
        },
        {
          date: '01.08(목)',
          title: '다 같이 바쁜 날',
          note: '서로 “오늘 늦어” 메시지 많았어',
          type: 'BUSY',
        },
        {
          date: '01.10(토)',
          title: '집밥 & 사진',
          note: '저녁 먹고 사진 업로드!',
          type: 'MEMORY',
        },
      ],
    },

    moments: {
      title: '놓치기 쉬웠던 순간',
      quote: {by: '엄마', text: '밥 먹었어? 늦지 말구~'},
      note: '평범한 말인데, 그 주의 다정함은 이런 데서 나오더라구.',
    },

    photoTotal: 9,
    photos: Array.from({length: 9}).map((_, i) => ({
      id: `p_${weekKey}_${i}`,
      url: `https://picsum.photos/900/900?random=${820 + i}`,
      caption:
        i % 6 === 0
          ? '주말'
          : i % 6 === 1
          ? '저녁'
          : i % 6 === 2
          ? '웃김'
          : i % 6 === 3
          ? '하늘'
          : i % 6 === 4
          ? '산책'
          : '단체샷',
    })),
  };
}

/* ================== SMALL UI ================== */
/** ✅ 스크롤 진행도 기반 프로그레스 */
const StoryProgress = memo(function StoryProgress({scrollX, total}) {
  return (
    <View style={styles.storyRow}>
      {Array.from({length: total}).map((_, i) => {
        const inputRange = [(i - 1) * W, i * W, (i + 1) * W];

        const width = scrollX.interpolate({
          inputRange,
          outputRange: ['0%', '100%', '100%'],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.25, 0.95, 0.55],
          extrapolate: 'clamp',
        });

        return (
          <View key={`bar_${i}`} style={styles.storyBarTrack}>
            <Animated.View style={[styles.storyBarFill, {width, opacity}]} />
          </View>
        );
      })}
    </View>
  );
});

const KinoChip = memo(function KinoChip({text}) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
});

const StatTile = memo(function StatTile({label, value, color}) {
  return (
    <View style={styles.statTile}>
      <View style={[styles.statDot, {backgroundColor: color || KINO_YELLOW}]} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
});

const ActionRow = memo(function ActionRow() {
  return (
    <View style={styles.actionRow}>
      <View style={styles.actionLeft}>
        <View style={styles.actionIcon} />
        <View style={styles.actionIcon} />
        <View style={styles.actionIcon} />
      </View>
      <View style={styles.actionRight}>
        <View style={[styles.actionIcon, {opacity: 0.6}]} />
      </View>
    </View>
  );
});

function PageShell({children}) {
  return <View style={styles.page}>{children}</View>;
}

function SubtleHint({text}) {
  return (
    <View style={styles.hintWrap}>
      <Text style={styles.hintText}>{text}</Text>
    </View>
  );
}

const TagPill = memo(function TagPill({text, tone = 'default'}) {
  const bg =
    tone === 'pink'
      ? 'rgba(255,95,162,0.16)'
      : tone === 'yellow'
      ? 'rgba(255,216,77,0.16)'
      : tone === 'green'
      ? 'rgba(66,211,156,0.16)'
      : 'rgba(89,167,255,0.16)';

  const border =
    tone === 'pink'
      ? 'rgba(255,95,162,0.28)'
      : tone === 'yellow'
      ? 'rgba(255,216,77,0.28)'
      : tone === 'green'
      ? 'rgba(66,211,156,0.28)'
      : 'rgba(89,167,255,0.28)';

  return (
    <View style={[styles.tagPill, {backgroundColor: bg, borderColor: border}]}>
      <Text style={styles.tagPillText}>{text}</Text>
    </View>
  );
});

const QuoteCard = memo(function QuoteCard({title, by, text, note}) {
  return (
    <View style={styles.quoteCard}>
      <Text style={styles.quoteTitle}>{title}</Text>

      <View style={styles.quoteBubble}>
        <Text style={styles.quoteText} numberOfLines={3}>
          “{text}”
        </Text>
        {by ? <Text style={styles.quoteBy}>- {by}</Text> : null}
      </View>

      {note ? <Text style={styles.quoteNote}>{note}</Text> : null}
    </View>
  );
});

function pickColorByIndex(i) {
  return i === 0
    ? KINO_YELLOW
    : i === 1
    ? KINO_GREEN
    : i === 2
    ? KINO_BLUE
    : KINO_PINK;
}

/* ================== SCREEN ================== */
export default function MagazineDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const weekKey = route?.params?.weekKey || '2026-01-05~2026-01-11';
  const payloadFromPrev = route?.params?.magazinePayload || null;

  const data = useMemo(
    () => payloadFromPrev || buildDummyWeeklyMagazine(weekKey),
    [payloadFromPrev, weekKey],
  );

  const listRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(8)).current;

  // ✅ 스크롤 진행도(상단 바/배경 흐름에 사용)
  const scrollX = useRef(new Animated.Value(0)).current;

  const playIntro = useCallback(() => {
    fade.setValue(0);
    slide.setValue(8);
    Animated.parallel([
      Animated.timing(fade, {toValue: 1, duration: 220, useNativeDriver: true}),
      Animated.timing(slide, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  useFocusEffect(
    useCallback(() => {
      playIntro();
      setPageIndex(0);
      scrollX.setValue(0);
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({offset: 0, animated: false});
      });
    }, [playIntro, scrollX]),
  );

  const pages = useMemo(() => {
    const moodTrend = data.mood?.trend || [];
    const chatDaily = data.chat?.daily || [];

    return [
      /* ===== cover ===== */
      {
        id: 'cover',
        render: () => (
          <View style={styles.coverWrap}>
            <FastImage
              source={{uri: data.coverUrl}}
              style={styles.coverImg}
              resizeMode={FastImage.resizeMode.cover}
            />

            <View style={styles.coverShade} />

            <View style={styles.coverTop}>
              <Text style={styles.coverKicker}>
                KINOVER · WEEKLY FAMILY MAGAZINE
              </Text>

              <View style={styles.coverBadgeRow}>
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>Weekly</Text>
                </View>
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>Family</Text>
                </View>
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>Memory</Text>
                </View>
              </View>

              <View
                style={{
                  marginTop: getResponsiveHeight(10),
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                <TagPill tone="yellow" text="한 줄 요약" />
                <TagPill tone="blue" text="접속 & 감정" />
                <TagPill tone="green" text="대화 하이라이트" />
                <TagPill tone="pink" text="일정 & 사진" />
              </View>
            </View>

            <View style={styles.coverBottom}>
              <Text style={styles.coverTitle}>{data.title}</Text>
              <Text style={styles.coverSub}>{data.subtitle}</Text>

              <View style={styles.coverOneLinerBox}>
                <Text style={styles.coverOneLinerLabel}>이번 주 한 줄</Text>
                <Text style={styles.coverOneLinerText} numberOfLines={2}>
                  {data.oneLiner}
                </Text>
              </View>

              <SubtleHint text="좌우로 넘겨서 매거진처럼 읽어줘" />
            </View>
          </View>
        ),
      },

      /* ===== page1: Weekly One-liner + highlights ===== */
      {
        id: 'p1',
        render: () => (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: getResponsiveHeight(22)}}>
            <View style={styles.heroBlock}>
              <KinoChip text="WEEKLY ONE-LINER" />
              <Text style={styles.heroTitle}>이번 주 가족 한 줄</Text>
              <Text style={styles.heroDesc}>
                숫자는 참고용! 핵심은 “어떤 한 주였는지” 느낌이야.
              </Text>
            </View>

            <View style={styles.oneLinerCard}>
              <Text style={styles.oneLinerText} numberOfLines={3}>
                {data.oneLiner}
              </Text>

              <View style={styles.oneLinerTags}>
                <TagPill
                  tone="yellow"
                  text={data.highlights?.[0]?.value || '피크 타임'}
                />
                <TagPill
                  tone="pink"
                  text={`${
                    data.mood?.familyMainText ||
                    data.highlights?.[1]?.value ||
                    '무드'
                  }`}
                />
                <TagPill
                  tone="green"
                  text={`대화 폭발 · ${data.chat?.peakDayLabel || '-'}`}
                />
              </View>

              <View style={styles.mainMoodRow}>
                <Text style={styles.mainMoodLabel}>대표 무드</Text>
                <View style={styles.mainMoodPill}>
                  <StateIcon state={data.mood?.familyMainState} size={18} />
                  <Text style={styles.mainMoodText}>
                    {data.mood?.familyMainText || '무드'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statGrid}>
              {(data.highlights || []).map(h => (
                <StatTile
                  key={h.label}
                  label={h.label}
                  value={h.value}
                  color={h.color}
                />
              ))}
            </View>

            {data.moments ? (
              <QuoteCard
                title={data.moments.title}
                by={data.moments.quote?.by}
                text={data.moments.quote?.text}
                note={data.moments.note}
              />
            ) : null}
          </ScrollView>
        ),
      },

      /* ===== page2: 접속 & 감정 ===== */
      {
        id: 'p2',
        render: () => (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: getResponsiveHeight(22)}}>
            <View style={styles.heroBlock}>
              <KinoChip text="ACTIVITY & MOOD" />
              <Text style={styles.heroTitle}>접속 & 감정 흐름</Text>
              <Text style={styles.heroDesc}>
                멤버별 활동 + 가족 무드의 흐름을 모아봤어.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>FAMILY MOOD TREND</Text>

              <View style={styles.moodRow}>
                {moodTrend.map((t, i) => (
                  <View key={`${t.day}_${i}`} style={styles.moodCell}>
                    <Text style={styles.moodDay}>{t.day}</Text>
                    <StateIcon
                      state={t.state}
                      size={22}
                      style={styles.moodIcon}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.moodHintRow}>
                <Text style={styles.moodHint}>이번 주 대표 무드</Text>
                <View style={styles.moodHintPill}>
                  <StateIcon state={data.mood?.familyMainState} size={18} />
                  <Text style={styles.moodHintText}>
                    {data.mood?.familyMainText}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.feedCard}>
              <View style={styles.feedHeader}>
                <View style={styles.avatarRing}>
                  <View style={styles.avatarInner} />
                </View>

                <View style={{flex: 1}}>
                  <Text style={styles.feedUser}>멤버 활동</Text>
                  <Text style={styles.feedSub}>
                    접속한 날(0~7) · 최근 활동 · 무드
                  </Text>
                </View>

                <Text style={styles.feedMore}>⋯</Text>
              </View>

              <View style={styles.feedBody}>
                {data.members.map((m, idx) => {
                  const pct = Math.min(
                    100,
                    Math.round((Number(m.activeDays || 0) / 7) * 100),
                  );
                  const c = pickColorByIndex(idx);

                  return (
                    <View key={m.userId || m.name} style={styles.memberRow}>
                      <View style={styles.memberLeft}>
                        <StateIcon
                          state={m.moodState}
                          size={22}
                          style={styles.memberMoodIcon}
                        />

                        <View style={{flex: 1}}>
                          <Text style={styles.memberName}>{m.name}</Text>
                          <Text style={styles.memberMeta}>
                            접속 {m.activeDays}일 · 마지막 {m.lastActive}
                          </Text>

                          <View style={styles.memberTrack}>
                            <View
                              style={[
                                styles.memberFill,
                                {width: `${pct}%`, backgroundColor: c},
                              ]}
                            />
                          </View>

                          {!!m.moodTrend?.length ? (
                            <View style={styles.memberMoodTrendRow}>
                              {m.moodTrend.slice(0, 7).map((state, i) => (
                                <StateIcon
                                  key={`${m.userId}_m_${i}`}
                                  state={state}
                                  size={16}
                                  style={styles.memberMoodMiniIcon}
                                />
                              ))}
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.memberBadge}>
                        <Text style={styles.memberBadgeText}>{pct}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <ActionRow />
              <Text style={styles.likeText}>
                팁: 여기서는 “순위” 느낌 내지 말고, 흐름만 예쁘게 보여주는 게
                제일 편해.
              </Text>
            </View>
          </ScrollView>
        ),
      },

      /* ===== page3: 채팅 하이라이트 ===== */
      {
        id: 'p3',
        render: () => (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: getResponsiveHeight(22)}}>
            <View style={styles.heroBlock}>
              <KinoChip text="CHAT HIGHLIGHT" />
              <Text style={styles.heroTitle}>대화로 본 이번 주</Text>
              <Text style={styles.heroDesc}>
                총량 + 요일 흐름 + 키워드 + 시간대 히트로 분위기를 뽑아봤어.
              </Text>
            </View>

            <View style={styles.bigStatRow}>
              <View style={styles.bigStat}>
                <Text style={styles.bigStatLabel}>총 메시지</Text>
                <Text style={styles.bigStatValue}>
                  {data.chat.totalMessages}
                </Text>
              </View>
              <View style={styles.bigStat}>
                <Text style={styles.bigStatLabel}>대화 폭발</Text>
                <Text style={styles.bigStatValue}>
                  {data.chat.peakDayLabel}
                </Text>
              </View>
              <View style={styles.bigStat}>
                <Text style={styles.bigStatLabel}>최다 발화</Text>
                <Text style={styles.bigStatValue}>{data.chat.topSpeaker}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>DAILY FLOW</Text>

              {chatDaily.map((d, idx) => {
                const max = Math.max(
                  ...chatDaily.map(x => Number(x.count || 0)),
                  1,
                );
                const pct = Math.round((Number(d.count || 0) / max) * 100);
                return (
                  <View key={`${d.day}_${idx}`} style={styles.timeRow}>
                    <Text style={styles.timeSlot}>{d.day}</Text>
                    <View style={styles.timeTrack}>
                      <View style={[styles.timeFill, {width: `${pct}%`}]} />
                    </View>
                    <Text style={styles.timeValue}>{d.count}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>TOP KEYWORDS</Text>
              <View style={styles.hashWrap}>
                {data.chat.keywords.map(k => (
                  <View key={k.word} style={styles.hashPill}>
                    <Text style={styles.hashWord}>#{k.word}</Text>
                    <Text style={styles.hashCount}>{k.count}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>TIME HEAT</Text>

              {data.chat.timeHeat.map((t, idx) => (
                <View
                  key={t.slot}
                  style={[
                    styles.timeRow,
                    idx === 0 ? {marginTop: getResponsiveHeight(10)} : null,
                  ]}>
                  <Text style={styles.timeSlot}>{t.slot}</Text>
                  <View style={styles.timeTrack}>
                    <View style={[styles.timeFill, {width: `${t.pct}%`}]} />
                  </View>
                  <Text style={styles.timeValue}>{t.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        ),
      },

      /* ===== page4: 일정 요약 ===== */
      {
        id: 'p4',
        render: () => (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: getResponsiveHeight(22)}}>
            <View style={styles.heroBlock}>
              <KinoChip text="CALENDAR" />
              <Text style={styles.heroTitle}>이번 주 일정 요약</Text>
              <Text style={styles.heroDesc}>
                나열 말고 “바빴던 날 / 겹친 날 / 주요 일정”만 딱.
              </Text>
            </View>

            <View style={styles.duoRow}>
              <View style={styles.duoCard}>
                <Text style={styles.duoLabel}>가장 바빴던 날</Text>
                <Text style={styles.duoValue}>
                  {data.calendar.busiestDayLabel}
                </Text>
              </View>
              <View style={styles.duoCard}>
                <Text style={styles.duoLabel}>가족 겹친 날</Text>
                <Text style={styles.duoValue}>
                  {data.calendar.overlapDays}일
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>WEEK TIMELINE</Text>

              {data.calendar.timeline.map((item, i) => (
                <View
                  key={`${item.date}_${item.title}`}
                  style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        i === 0
                          ? {backgroundColor: KINO_PINK, opacity: 0.95}
                          : null,
                      ]}
                    />
                    <View style={styles.timelineLine} />
                  </View>

                  <View style={styles.timelineBody}>
                    <Text style={styles.timelineDate}>{item.date}</Text>
                    <Text style={styles.timelineName}>{item.title}</Text>
                    <Text style={styles.timelineNote}>{item.note}</Text>
                  </View>

                  <View style={styles.timelineTag}>
                    <Text style={styles.timelineTagText}>
                      {item.type || 'PLAN'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ),
      },

      /* ===== page5: 사진 ===== */
      {
        id: 'p5',
        render: () => (
          <View style={{flex: 1}}>
            <View style={styles.heroBlock}>
              <KinoChip text="PHOTOS" />
              <Text style={styles.heroTitle}>이번 주의 장면들</Text>
              <Text style={styles.heroDesc}>
                사진 하이라이트 · 총 {data.photoTotal}장
              </Text>
            </View>

            <FlatList
              data={data.photos}
              keyExtractor={p => p.id}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: getResponsiveHeight(22)}}
              columnWrapperStyle={{gap: getResponsiveWidth(4)}}
              renderItem={({item, index}) => (
                <Pressable
                  onPress={() => {
                    // navigation.navigate('AlbumViewer', {weekKey: data.weekKey, photoId: item.id});
                  }}
                  style={[
                    styles.gridCell,
                    index % 7 === 0 ? styles.gridCellBig : null,
                  ]}>
                  <FastImage
                    source={{uri: item.url}}
                    style={styles.gridImg}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <View style={styles.gridShade} />
                  <View style={styles.gridCap}>
                    <Text style={styles.gridCapText} numberOfLines={1}>
                      {item.caption}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        ),
      },
    ];
  }, [data, navigation]);

  const totalPages = pages.length;

  const onMomentumScrollEnd = useCallback(e => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setPageIndex(idx);
  }, []);

  const renderPage = useCallback(
    ({item}) => <PageShell>{item.render()}</PageShell>,
    [],
  );

  // ✅ 페이지 흐름(시간감) 틴트
  const pageTintStyle = useMemo(() => {
    const inputRange = pages.map((_, i) => i * W);

    // pages 개수가 달라져도 안정적으로 맞추기
    const colors = [
      'rgba(255,216,77,1)',
      'rgba(89,167,255,1)',
      'rgba(66,211,156,1)',
      'rgba(255,95,162,1)',
      'rgba(89,167,255,1)',
      'rgba(255,216,77,1)',
    ];
    const opacities = [0.10, 0.14, 0.12, 0.16, 0.12, 0.18];

    const outputRangeColor = inputRange.map((_, i) => colors[i % colors.length]);
    const outputRangeOpacity = inputRange.map(
      (_, i) => opacities[i % opacities.length],
    );

    return {
      backgroundColor: scrollX.interpolate({
        inputRange,
        outputRange: outputRangeColor,
        extrapolate: 'clamp',
      }),
      opacity: scrollX.interpolate({
        inputRange,
        outputRange: outputRangeOpacity,
        extrapolate: 'clamp',
      }),
    };
  }, [pages, scrollX]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {Platform.OS === 'android' ? (
        <StatusBar
          backgroundColor="transparent"
          translucent
          barStyle="light-content"
        />
      ) : (
        <StatusBar barStyle="light-content" />
      )}

      {/* 상단 진행바 + 헤더 */}
      <View style={styles.topOverlay} pointerEvents="box-none">
        <StoryProgress scrollX={scrollX} total={totalPages} />

        <View style={styles.header} pointerEvents="box-none">
          <View style={{flex: 1, alignItems: 'center'}}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {data.title}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {data.subtitle}
            </Text>
          </View>
        </View>
      </View>

      {/* 배경 블롭 */}
      <View style={styles.blobA} pointerEvents="none" />
      <View style={styles.blobB} pointerEvents="none" />
      <View style={styles.blobC} pointerEvents="none" />

      {/* ✅ 페이지 흐름 틴트(시간감) */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, pageTintStyle]}
      />

      <View style={styles.darkWash} pointerEvents="none" />

      <Animated.View
        style={[
          styles.body,
          {
            opacity: fade,
            transform: [{translateY: slide}],
          },
        ]}>
        <FlatList
          ref={listRef}
          data={pages}
          keyExtractor={p => p.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderPage}
          onMomentumScrollEnd={onMomentumScrollEnd}
          getItemLayout={(_, index) => ({length: W, offset: W * index, index})}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {x: scrollX}}}],
            {useNativeDriver: false},
          )}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={W}
          snapToAlignment="start"
          // Android에서 너무 딱딱하면 아래 줄 주석 처리
          // disableIntervalMomentum
        />
      </Animated.View>
    </SafeAreaView>
  );
}

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: NAVY},
  body: {flex: 1},
  topOverlay: {
    zIndex: 30,
    backgroundColor: 'transparent',
  },

  storyRow: {
    paddingHorizontal: getResponsiveWidth(12),
    flexDirection: 'row',
    gap: getResponsiveWidth(6),
  },
  storyBarTrack: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  storyBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: WHITE,
    opacity: 0.9,
    width: '0%',
  },

  header: {
    paddingTop: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(14),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerBtn: {
    width: getResponsiveWidth(36),
    height: getResponsiveWidth(36),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: {
    fontSize: getResponsiveFontSize(28),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },
  headerSub: {
    marginTop: 2,
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Regular',
    color: MUTED,
  },

  page: {
    width: W,
    paddingTop: getResponsiveHeight(20),
    paddingHorizontal: getResponsiveWidth(14),
    paddingBottom: getResponsiveHeight(26),
  },

  /* blobs */
  blobA: {
    position: 'absolute',
    width: W * 0.9,
    height: W * 0.9,
    borderRadius: 9999,
    backgroundColor: KINO_YELLOW,
    opacity: 0.1,
    top: -W * 0.25,
    left: -W * 0.25,
  },
  blobB: {
    position: 'absolute',
    width: W * 0.85,
    height: W * 0.85,
    borderRadius: 9999,
    backgroundColor: KINO_PINK,
    opacity: 0.08,
    bottom: -W * 0.25,
    right: -W * 0.3,
  },
  blobC: {
    position: 'absolute',
    width: W * 0.6,
    height: W * 0.6,
    borderRadius: 9999,
    backgroundColor: KINO_BLUE,
    opacity: 0.16,
    top: H * 0.35,
    right: -W * 0.25,
  },
  darkWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,15,20,0.55)',
  },

  /* cover */
  coverWrap: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  coverImg: {width: '100%', height: '100%'},
  coverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  coverTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: getResponsiveWidth(16),
    paddingTop: getResponsiveHeight(16),
  },
  coverKicker: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 0.8,
  },
  coverBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: getResponsiveHeight(10),
  },
  badgePill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },
  coverBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: getResponsiveWidth(16),
    paddingBottom: getResponsiveHeight(18),
    paddingTop: getResponsiveHeight(16),
    backgroundColor: 'rgba(0,0,0,0.26)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  coverTitle: {
    fontSize: getResponsiveFontSize(28),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },
  coverSub: {
    marginTop: getResponsiveHeight(6),
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    color: SUB,
    lineHeight: getResponsiveFontSize(18),
  },

  coverOneLinerBox: {
    marginTop: getResponsiveHeight(12),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(0,0,0,0.20)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coverOneLinerLabel: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: MUTED,
    letterSpacing: 0.4,
  },
  coverOneLinerText: {
    marginTop: 6,
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
    lineHeight: getResponsiveFontSize(19),
  },

  hintWrap: {
    marginTop: getResponsiveHeight(10),
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  hintText: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Regular',
    color: 'rgba(255,255,255,0.92)',
  },

  tagPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagPillText: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.2,
  },

  /* hero */
  heroBlock: {
    paddingHorizontal: getResponsiveWidth(2),
    marginBottom: getResponsiveHeight(12),
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.4,
  },
  heroTitle: {
    marginTop: getResponsiveHeight(10),
    fontSize: getResponsiveFontSize(24),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },
  heroDesc: {
    marginTop: getResponsiveHeight(6),
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    color: SUB,
    lineHeight: getResponsiveFontSize(19),
  },

  /* weekly one-liner card */
  oneLinerCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(14),
    marginBottom: getResponsiveHeight(14),
  },
  oneLinerText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
    lineHeight: getResponsiveFontSize(22),
  },
  oneLinerTags: {
    marginTop: getResponsiveHeight(12),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  mainMoodRow: {
    marginTop: getResponsiveHeight(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainMoodLabel: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: MUTED,
  },
  mainMoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  mainMoodText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },

  /* stat tiles */
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveWidth(10),
    marginBottom: getResponsiveHeight(14),
  },
  statTile: {
    width: (W - getResponsiveWidth(14) * 2 - getResponsiveWidth(10)) / 2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(12),
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Regular',
    color: MUTED,
  },
  statValue: {
    marginTop: 6,
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },

  /* quote card */
  quoteCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(14),
    marginBottom: getResponsiveHeight(14),
  },
  quoteTitle: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
    letterSpacing: 0.8,
    opacity: 0.95,
  },
  quoteBubble: {
    marginTop: getResponsiveHeight(12),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  quoteText: {
    fontSize: getResponsiveFontSize(14.5),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
    lineHeight: getResponsiveFontSize(20),
  },
  quoteBy: {
    marginTop: 8,
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Regular',
    color: MUTED,
  },
  quoteNote: {
    marginTop: 10,
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: SUB,
    lineHeight: getResponsiveFontSize(18),
  },

  /* mood */
  moodRow: {
    marginTop: getResponsiveHeight(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  moodCell: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.16)',
    alignItems: 'center',
    paddingVertical: 10,
  },
  moodDay: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Regular',
    color: MUTED,
  },
  moodIcon: {marginTop: 8},
  moodHintRow: {
    marginTop: getResponsiveHeight(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodHint: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: SUB,
  },
  moodHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  moodHintText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },

  /* feed */
  feedCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    overflow: 'hidden',
  },
  feedHeader: {
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  avatarRing: {
    width: getResponsiveWidth(34),
    height: getResponsiveWidth(34),
    borderRadius: 999,
    padding: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  feedUser: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },
  feedSub: {
    marginTop: 2,
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Regular',
    color: MUTED,
  },
  feedMore: {
    fontSize: getResponsiveFontSize(18),
    color: WHITE,
    opacity: 0.85,
    paddingHorizontal: 6,
  },
  feedBody: {
    paddingHorizontal: getResponsiveWidth(14),
    paddingBottom: getResponsiveHeight(8),
  },
  memberRow: {
    paddingVertical: getResponsiveHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  memberLeft: {flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1},
  memberMoodIcon: {opacity: 0.95},
  memberName: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },
  memberMeta: {
    marginTop: 2,
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Regular',
    color: MUTED,
  },
  memberTrack: {
    marginTop: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  memberFill: {height: '100%', borderRadius: 999},
  memberMoodTrendRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 6,
    opacity: 0.95,
  },
  memberMoodMiniIcon: {opacity: 0.95},
  memberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  memberBadgeText: {
    fontSize: getResponsiveFontSize(10.5),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },

  actionRow: {
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  actionLeft: {flexDirection: 'row', gap: 8},
  actionRight: {flexDirection: 'row', gap: 8},
  actionIcon: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.90)',
    opacity: 0.26,
  },
  likeText: {
    paddingHorizontal: getResponsiveWidth(14),
    paddingBottom: getResponsiveHeight(14),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: SUB,
  },

  /* page3 stats */
  bigStatRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    marginBottom: getResponsiveHeight(14),
  },
  bigStat: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(14),
  },
  bigStatLabel: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Regular',
    color: MUTED,
  },
  bigStatValue: {
    marginTop: 8,
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(14),
    marginBottom: getResponsiveHeight(14),
  },
  cardTitle: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
    letterSpacing: 0.8,
    opacity: 0.95,
  },

  hashWrap: {
    marginTop: getResponsiveHeight(10),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  hashWord: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },
  hashCount: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: MUTED,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: getResponsiveHeight(12),
  },
  timeSlot: {
    width: getResponsiveWidth(44),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },
  timeTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  timeFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: KINO_YELLOW,
    opacity: 0.95,
  },
  timeValue: {
    width: getResponsiveWidth(44),
    textAlign: 'right',
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: MUTED,
  },

  /* page4 */
  duoRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    marginBottom: getResponsiveHeight(14),
  },
  duoCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(14),
  },
  duoLabel: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Regular',
    color: MUTED,
  },
  duoValue: {
    marginTop: 8,
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },

  timelineRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: getResponsiveHeight(14),
  },
  timelineLeft: {width: 16, alignItems: 'center'},
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.48)',
    marginTop: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 6,
    borderRadius: 999,
  },
  timelineBody: {flex: 1},
  timelineDate: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Regular',
    color: MUTED,
  },
  timelineName: {
    marginTop: 4,
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
  },
  timelineNote: {
    marginTop: 4,
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Regular',
    color: SUB,
    lineHeight: getResponsiveFontSize(16),
  },
  timelineTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginTop: 2,
  },
  timelineTagText: {
    fontSize: getResponsiveFontSize(10.5),
    fontFamily: 'Pretendard-SemiBold',
    color: WHITE,
    letterSpacing: 0.6,
  },

  /* page5 grid */
  gridCell: {
    width: (W - getResponsiveWidth(14) * 2 - getResponsiveWidth(4) * 2) / 3,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: getResponsiveWidth(4),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  gridCellBig: {borderRadius: 18},
  gridImg: {width: '100%', height: '100%'},
  gridShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  gridCap: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  gridCapText: {
    fontSize: getResponsiveFontSize(10.5),
    fontFamily: 'Pretendard-SemiBold',
    color: 'rgba(255,255,255,0.92)',
  },
});

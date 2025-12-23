// src/features/schedule/components/ScreenConfetti.jsx
import React, {useEffect, useMemo, useRef} from 'react';
import {View, StyleSheet, Animated, Easing, Dimensions} from 'react-native';

const {width: W, height: H} = Dimensions.get('window');

// ✅ 모달 "바로 뒤"에서 팡! (모달 박스 중앙 근처) -> 위로 솟았다가 아래로 떨어짐
// ✅ 더 예쁘게: 여러 색/모양(스트립, 도트), 크기 다양, 가벼운 스핀, 중력감, 좌우 흩뿌리기
const CONFETTI_COUNT = 44;
const COLORS = [
  '#FFC84D', // 키노버 노랑
  '#FF8A65',
  '#7DD3FC',
  '#A7F3D0',
  '#C4B5FD',
  '#FCA5A5',
  '#FDE68A',
];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

export default function ScreenConfetti({
  visible,
  // ✅ 모달 박스 기준 "살짝 위쪽"에서 터지는 느낌 (0.5면 정중앙, 0.45면 조금 위)
  originX = 0.5,
  originY = 0.48,
}) {
  const progress = useRef(new Animated.Value(0)).current;

  // ✅ visible 켤 때마다 새 조각 구성되게 seed처럼 "키"를 바꿔주면 더 자연스러움
  const seedRef = useRef(0);

  const pieces = useMemo(() => {
    // seedRef.current 값이 바뀌면 재생성됨
    seedRef.current += 1;

    return Array.from({length: CONFETTI_COUNT}).map((_, i) => {
      const type = Math.random() < 0.7 ? 'strip' : 'dot'; // 스트립 위주 + 도트 약간
      const size = type === 'strip' ? rand(10, 18) : rand(6, 10);
      const thickness = type === 'strip' ? rand(4, 7) : size;

      const color = COLORS[Math.floor(Math.random() * COLORS.length)];

      // ✅ "팡" 할 때 좌우로 퍼지는 속도
      const vx = rand(-180, 180);
      // ✅ 위로 튀는 속도(음수) — 더 강하게 위로 올라가게
      const vy = rand(-820, -720);

      // ✅ 떨어질 때 중력감 (크면 빨리 떨어지는 느낌)
      const gravity = rand(1200, 1700);

      // ✅ 회전
      const spin = rand(-540, 540);

      // ✅ 약간의 지연으로 폭발 느낌
      const delay = rand(0, 80);

      // ✅ 약간씩 서로 다른 드래그(공기저항) 느낌
      const drag = rand(0.82, 0.92);

      return {
        key: `p_${seedRef.current}_${i}`,
        type,
        size,
        thickness,
        color,
        vx,
        vy,
        gravity,
        spin,
        delay,
        drag,
        // 좌우 약간 흩어진 초기 오프셋
        ox: rand(-14, 14),
        oy: rand(-10, 10),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]); // ✅ visible 바뀔 때마다 새 조각

  useEffect(() => {
    if (!visible) return;

    progress.stopAnimation();
    progress.setValue(0);

    Animated.timing(progress, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, progress]);

  if (!visible) return null;

  // ✅ 시작점: 모달 "바로 뒤"로 보이게 중앙 근처에서 시작
  const x0 = W * originX;
  const y0 = H * originY;

  return (
    // ✅ CustomModal에서 이미 absoluteFill + pointerEvents="none"로 감싸고 있을 수도 있지만,
    // 여기 단독 사용도 가능하게 유지
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map(p => {
        // ✅ 시간 진행: 0 -> 1
        // 폭발 초반 더 빠르게, 후반 감속
        const t = progress;

        // ✅ 물리 느낌 (근사):
        // x = vx * t * drag^k
        // y = vy * t + 0.5 * g * t^2
        // (여기서는 t를 0~1로 두고 스케일링)
        const tScaled = t.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

        // X 이동
        const translateX = tScaled.interpolate({
          inputRange: [0, 1],
          outputRange: [p.ox, p.ox + p.vx],
        });

        // Y 이동: 위로 올라갔다가(초반) 아래로 떨어짐(후반)
        // y(t) = vy*t + 0.5*g*t^2  (t를 0~1로)
        const translateY = tScaled.interpolate({
          inputRange: [0, 1],
          outputRange: [p.oy, p.oy + p.vy + 0.5 * p.gravity],
        });

        // ✅ 회전
        const rotate = tScaled.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spin}deg`],
        });

        // ✅ 페이드: 초반에 나타나고, 끝에서 사라짐
        const opacity = t.interpolate({
          inputRange: [0, 0.08, 0.85, 1],
          outputRange: [0, 1, 1, 0],
        });

        // ✅ 살짝 스케일(팡!)
        const scale = t.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0.9, 1, 1],
        });

        // ✅ 개별 딜레이(Animated는 딜레이를 스타일로 못 주니까 위치에 반영)
        // 간단하게: opacity만 늦게 뜨는 느낌
        const delayedOpacity = Animated.multiply(
          opacity,
          t.interpolate({
            inputRange: [0, p.delay / 1400, 1],
            outputRange: [0, 1, 1],
          }),
        );

        const baseLeft = x0 - p.size / 2;
        const baseTop = y0 - p.thickness / 2;

        return (
          <Animated.View
            key={p.key}
            style={[
              styles.piece,
              {
                left: baseLeft,
                top: baseTop,
                width: p.type === 'strip' ? p.size : p.size,
                height: p.type === 'strip' ? p.thickness : p.size,
                borderRadius: p.type === 'strip' ? 6 : 999,
                backgroundColor: p.color,
                opacity: delayedOpacity,
                transform: [{translateX}, {translateY}, {rotate}, {scale}],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
  },
});

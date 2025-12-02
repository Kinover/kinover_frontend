// src/features/common/guide/useGuide.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useState, useEffect} from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useGuide(storageKey, steps = [], enabled = false) {
  const [isGuideVisible, setIsGuideVisible] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  useEffect(() => {
    if (!enabled || !steps.length) return;

    // ★ 테스트용: 무조건 가이드 열기
    // setIsGuideVisible(true);
    // setGuideStep(0);

    // 아래 원래코드 비활성화
    
    const checkGuide = async () => {
      try {
        const hasShown = await AsyncStorage.getItem(storageKey);
        if (!hasShown) {
          setIsGuideVisible(true);
          setGuideStep(0);
        }
      } catch (e) {
        setIsGuideVisible(true);
      }
    };

    checkGuide();
    
  }, [storageKey, enabled, steps.length]);

  const finishGuide = async () => {
    setIsGuideVisible(false);

    // 테스트 중에는 실제로 기록 저장하지 않음
    
    try {
      await AsyncStorage.setItem(storageKey, 'true');
    } catch (e) {null;}
    
  };

  const nextStep = () => {
    if (guideStep < steps.length - 1) {
      setGuideStep(prev => prev + 1);
    } else {
      finishGuide();
    }
  };

  const skipGuide = () => {
    finishGuide();
  };

  const currentGuide = steps[guideStep] || null;

  return {
    isGuideVisible,
    guideStep,
    currentGuide,
    totalSteps: steps.length,
    nextStep,
    skipGuide,
  };
}

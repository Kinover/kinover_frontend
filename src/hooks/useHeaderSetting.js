import React, {useLayoutEffect, useMemo} from 'react';
import {Text} from 'react-native';
import {useSelector} from 'react-redux';

import {RenderHeaderRightChatSetting} from '../app/navigation/helpers/tabHeaderHelpers';
import {HEADER_STYLES} from 'styles/style';

export default function useHeaderSetting(
  navigation,
  setIsSettingsOpen,
  title,
  isKino,
) {
  // ✅ 폰트모드 구독: "옵션 갱신 트리거" 역할
  const fontMode = useSelector(state => state.ui.fontMode);

  // ✅ 스타일은 1번만 계산
  const headerStyle = useMemo(() => {
    const base = HEADER_STYLES();
    return {
      fontFamily: base.defaultTitleFontFamily,
      fontSize: base.defaultTitleFontSize,
      color: base.defaultTitleFontColor,
    };
  }, [fontMode]); // ✅ fontMode 바뀌면 HEADER_STYLES() 재평가

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RenderHeaderRightChatSetting setIsSettingsOpen={setIsSettingsOpen} />
      ),
      headerTitle: () => (
        <Text allowFontScaling={false} style={headerStyle} numberOfLines={1}>
          {!isKino ? title : '키노상담소'}
        </Text>
      ),
    });
  }, [navigation, setIsSettingsOpen, title, isKino, headerStyle, fontMode]);
}

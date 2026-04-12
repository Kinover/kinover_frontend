import React, {useLayoutEffect, useMemo} from 'react';
import {Text} from 'react-native';

import {RenderHeaderRightChatSetting} from '../app/navigation/helpers/tabHeaderHelpers';
import {useReduxFontMode} from 'hooks/useReduxFontMode';
import {HEADER_STYLES} from 'styles/style';

export default function useHeaderSetting(
  navigation,
  chatRoomId,
  title,
  isKino,
) {
 // 폰트모드 구독: "옵션 갱신 트리거" 역할
  const fontMode = useReduxFontMode();

 // 스타일은 1번만 계산
  const headerStyle = useMemo(() => {
    const base = HEADER_STYLES();
    return {
      fontFamily: base.defaultTitleFontFamily,
      fontSize: base.defaultTitleFontSize,
      color: base.defaultTitleFontColor,
    };
  }, [fontMode]); // fontMode 바뀌면 HEADER_STYLES() 재평가

  useLayoutEffect(() => {
    const openChatSettings = () => {
      if (!chatRoomId) return;
      navigation.navigate('채팅설정화면', {chatRoomId, isKino});
    };

    navigation.setOptions({
      headerRight: () => (
        <RenderHeaderRightChatSetting onPress={openChatSettings} />
      ),
      headerTitle: () => (
        <Text allowFontScaling={false} style={headerStyle} numberOfLines={1}>
          {!isKino ? title : '키노상담소'}
        </Text>
      ),
    });
  }, [navigation, chatRoomId, title, isKino, headerStyle, fontMode]);
}

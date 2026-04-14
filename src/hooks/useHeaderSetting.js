import React, {useLayoutEffect, useMemo} from 'react';
import {Text, View} from 'react-native';

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
      headerTitle: () =>
        isKino ? (
          <View style={{alignItems: 'center'}}>
            <Text allowFontScaling={false} style={headerStyle} numberOfLines={1}>
              키노상담소
            </Text>
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={{fontSize: 11, color: '#AAAAAA', marginTop: 1}}>
              키노는 AI입니다. 답변이 부정확할 수 있어요.
            </Text>
          </View>
        ) : (
          <Text allowFontScaling={false} style={headerStyle} numberOfLines={1}>
            {title}
          </Text>
        ),
    });
  }, [navigation, chatRoomId, title, isKino, headerStyle, fontMode]);
}

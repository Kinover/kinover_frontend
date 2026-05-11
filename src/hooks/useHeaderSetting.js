import React, {useLayoutEffect, useMemo} from 'react';
import {View} from 'react-native';

import AppText from 'components/AppText';
import {RenderHeaderRightChatSetting} from '../app/navigation/helpers/tabHeaderHelpers';
import {useReduxFontMode} from 'hooks/useReduxFontMode';
import {HEADER_STYLES} from 'styles/style';
import {useColors} from 'hooks/useColors';

export default function useHeaderSetting(
  navigation,
  chatRoomId,
  title,
  isKino,
) {
  const colors = useColors();
 // 폰트모드 구독: "옵션 갱신 트리거" 역할
  const fontMode = useReduxFontMode();

  const headerStyle = useMemo(() => {
    const base = HEADER_STYLES.get(colors);
    return {
      fontFamily: base.defaultTitleFontFamily,
      fontSize: base.defaultTitleFontSize,
      color: colors.textPrimary,
    };
  }, [fontMode, colors]);

  const kinoSubtitleStyle = useMemo(
    () => ({
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 1,
    }),
    [colors],
  );

  const roomTitle =
    title != null && String(title).trim() ? String(title).trim() : '채팅';

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
            <AppText
              allowFontScaling={false}
              style={headerStyle}
              numberOfLines={1}>
              키노상담소
            </AppText>
            <AppText
              allowFontScaling={false}
              numberOfLines={1}
              style={kinoSubtitleStyle}>
              키노는 AI입니다. 답변이 부정확할 수 있어요.
            </AppText>
          </View>
        ) : (
          <AppText
            allowFontScaling={false}
            style={headerStyle}
            numberOfLines={1}>
            {roomTitle}
          </AppText>
        ),
    });
  }, [
    navigation,
    chatRoomId,
    roomTitle,
    isKino,
    headerStyle,
    kinoSubtitleStyle,
    fontMode,
  ]);
}

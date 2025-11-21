import React, {useLayoutEffect} from 'react';
import {Text} from 'react-native';
import {RenderHeaderRightChatSetting} from '../app/navigation/helpers/tabHeaderHelpers';
import {HEADER_STYLES} from 'styles/style';

export default function useHeaderSetting(
  navigation,
  setIsSettingsOpen,
  title,
  isKino,
) {
  useLayoutEffect(() => {
    const options = {
      headerRight: () => (
        <RenderHeaderRightChatSetting setIsSettingsOpen={setIsSettingsOpen} />
      ),
    };

    options.headerTitle = () => (
      <Text
        style={{
          fontFamily: HEADER_STYLES.defaultTitleFontFamily,
          fontSize: HEADER_STYLES.defaultTitleFontSize,
          color: HEADER_STYLES.defaultTitleFontColor,
        }}>
        {!isKino ? title : '키노상담소'}
      </Text>
    );

    navigation.setOptions(options);
  }, [navigation, setIsSettingsOpen, title, isKino]);
}

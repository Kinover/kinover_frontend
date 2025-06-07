// hooks/useHeaderSetting.js
import {useLayoutEffect} from 'react';
import { Text } from 'react-native';
import {RenderHeaderRightChatSetting} from '../navigation/tabHeaderHelpers';

export default function useHeaderSetting(navigation, setIsSettingsOpen, title) {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text
          style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: 19,
            color: '#333',
          }}>
          {title}
        </Text>
      ),
      headerRight: () => (
        <RenderHeaderRightChatSetting setIsSettingsOpen={setIsSettingsOpen} />
      ),
    });
  }, [navigation, title]);
}

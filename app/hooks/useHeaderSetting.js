import {useLayoutEffect} from 'react';
import {Text} from 'react-native';
import {RenderHeaderRightChatSetting} from '../navigation/tabHeaderHelpers';

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
          fontFamily: 'Pretendard-Regular',
          fontSize: 19,
          color: '#333',
        }}>
        {!isKino ? title : '키노상담소'}
      </Text>
    );

    navigation.setOptions(options);
  }, [navigation, setIsSettingsOpen, title, isKino]);
}

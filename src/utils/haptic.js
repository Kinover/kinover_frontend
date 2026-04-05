import HapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const safeTrigger = type => {
  try {
    HapticFeedback?.trigger?.(type, options);
  } catch (e) {
  }
};

export const hapticLight = () => safeTrigger('impactLight');

export const hapticMedium = () => safeTrigger('impactMedium');

export const hapticHeavy = () => safeTrigger('impactHeavy');

export const hapticSelection = () => safeTrigger('selection');

export const hapticSuccess = () => safeTrigger('notificationSuccess');

export const hapticError = () => safeTrigger('notificationError');

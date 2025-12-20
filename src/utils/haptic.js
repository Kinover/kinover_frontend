import HapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const hapticLight = () =>
  HapticFeedback.trigger('impactLight', options);

export const hapticMedium = () =>
  HapticFeedback.trigger('impactMedium', options);

export const hapticHeavy = () =>
  HapticFeedback.trigger('impactHeavy', options);

export const hapticSelection = () =>
  HapticFeedback.trigger('selection', options);

export const hapticSuccess = () =>
  HapticFeedback.trigger('notificationSuccess', options);

export const hapticError = () =>
  HapticFeedback.trigger('notificationError', options);

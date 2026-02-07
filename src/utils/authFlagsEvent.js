// src/utils/authFlagsEvent.js
import {DeviceEventEmitter} from 'react-native';

export const AUTH_FLAGS_CHANGED = 'AUTH_FLAGS_CHANGED';

export function emitAuthFlagsChanged() {
  DeviceEventEmitter.emit(AUTH_FLAGS_CHANGED);
}

export function onAuthFlagsChanged(handler) {
  const sub = DeviceEventEmitter.addListener(AUTH_FLAGS_CHANGED, handler);
  return () => sub.remove();
}

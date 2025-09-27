// utils/chat/getSpacingStyle.js
import {getResponsiveHeight} from '../responsive';

export function getSpacingStyle({isGrouped, isSameSender}) {
  if (isGrouped) return {marginTop: getResponsiveHeight(8)};
  if (isSameSender) return {marginTop: getResponsiveHeight(12)};
  return {marginTop: getResponsiveHeight(20)};
}

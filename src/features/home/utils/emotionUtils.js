// utils/emotionUtils.js
export function getEmotionImage(emotion) {
  switch (emotion) {
    case 'ANNOYED':
      return require('../../../assets/state4/1.png');
    case 'WORRIED':
      return require('../../../assets/state4/2.png');
    case 'DEPRESSED':
      return require('../../../assets/state4/3.png');
    case 'SORRY':
      return require('../../../assets/state4/4.png');
    case 'TIRED':
      return require('../../../assets/state4/5.png');
    case 'NEUTRAL':
      return require('../../../assets/state4/6.png');
    case 'HAPPY':
      return require('../../../assets/state4/7.png');
    case 'EXCITED':
      return require('../../../assets/state4/8.png');
    default:
      return require('../../../assets/state4/6.png');
  }
}

// utils/emotionUtils.js
export function getEmotionImage(emotion) {
    switch (emotion) {
      case 'ANNOYED':
        return require('../../assets/state/1.png');
      case 'WORRIED':
        return require('../../assets/state/2.png');
      case 'DEPRESSED':
        return require('../../assets/state/3.png');
      case 'SORRY':
        return require('../../assets/state/4.png');
      case 'TIRED':
        return require('../../assets/state/5.png');
      case 'NEUTRAL':
        return require('../../assets/state/6.png');
      case 'HAPPY':
        return require('../../assets/state/7.png');
      case 'EXCITED':
        return require('../../assets/state/8.png');
      default:
        return require('../../assets/state/6.png');
    }
  }
  
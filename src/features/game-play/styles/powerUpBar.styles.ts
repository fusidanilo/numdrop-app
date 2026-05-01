import { Platform, StyleSheet } from 'react-native';

const powerUpShadow =
  Platform.OS === 'android'
    ? { elevation: 4 }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.09,
        shadowRadius: 5,
      };

export const powerUpBarStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 22,
    paddingHorizontal: 16,
    zIndex: 20,
    pointerEvents: 'box-none',
    overflow: 'visible',
  },
  btnShadow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FAF7F2',
    ...powerUpShadow,
  },
  btnFace: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: 'rgba(38, 38, 38, 0.1)',
  },
  btnFaceActive: {
    backgroundColor: 'rgba(168, 216, 201, 0.22)',
    borderColor: 'rgba(45, 107, 91, 0.35)',
  },
  btnFaceReuseBlocked: {
    opacity: 0.55,
  },
  btnFacePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  iconSlot: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
    includeFontPadding: false,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F4A6A0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8B3A34',
  },
});

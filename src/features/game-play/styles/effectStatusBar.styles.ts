import { Platform, StyleSheet } from 'react-native';

const chipShadow =
  Platform.OS === 'android'
    ? { elevation: 2 }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      };

export const effectBarStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    overflow: 'visible',
    paddingHorizontal: 12,
    zIndex: 12,
    pointerEvents: 'none',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    ...chipShadow,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

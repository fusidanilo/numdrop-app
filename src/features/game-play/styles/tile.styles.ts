import { StyleSheet } from 'react-native';
import { TILE_RADIUS } from '@/game/engine/loop';

const DIAMETER = TILE_RADIUS * 2;

export const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    width: DIAMETER,
    height: DIAMETER,
    borderRadius: TILE_RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: TILE_RADIUS,
  },
  num: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  kindBadge: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 10,
  },
});

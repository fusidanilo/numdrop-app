import { StyleSheet } from 'react-native';

/** Tier progress dots: active vs inactive fill */
export const tierDotColors = {
  active: '#3D3D3D',
  inactive: '#DDD',
} as const;

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'rgba(250,247,242,0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  hudThird: {
    flex: 1,
    justifyContent: 'center',
  },
  hudThirdLeft: {
    alignItems: 'flex-start',
  },
  hudThirdCenter: {
    alignItems: 'center',
  },
  hudThirdRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  livesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  heart: {
    fontSize: 22,
    color: '#F4A6A0',
  },
  centerCol: {
    alignItems: 'center',
    gap: 4,
  },
  scoreBlock: {
    alignItems: 'center',
  },
  comboRow: {
    height: 18,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  tierDotsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scoreText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#3D3D3D',
    letterSpacing: -1,
  },
  comboText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A8D8C9',
    marginTop: -2,
  },
  chainsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexShrink: 0,
  },
  badgePlaceholder: {
    width: 38,
    height: 38,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeNum: {
    fontSize: 18,
    fontWeight: '800',
  },
});

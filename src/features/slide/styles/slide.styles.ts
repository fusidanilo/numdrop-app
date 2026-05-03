import { StyleSheet } from 'react-native';

export const SLIDE_HORIZONTAL_PADDING = 28;

/** Ready screen: optional “resume from checkpoint” above primary Start. */
export const slideReadyStyles = StyleSheet.create({
  checkpointBtn: {
    width: '100%',
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C8C4BE',
    backgroundColor: 'transparent',
  },
  checkpointBtnPressed: {
    opacity: 0.75,
  },
  checkpointBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
});

export const slideScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: SLIDE_HORIZONTAL_PADDING,
    alignItems: 'center',
  },
  gameplay: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    gap: 24,
  },
  gridWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const slideHudStyles = StyleSheet.create({
  hud: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metricBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
  metricCenter: {
    alignItems: 'center',
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: 1.2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2E2E2E',
    letterSpacing: -0.5,
  },
  metricBest: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BBB',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  metricMovesLeft: {
    fontSize: 12,
    fontWeight: '600',
    color: '#AAA',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  metricCheckpoint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#BBB',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 13,
    paddingHorizontal: 4,
  },
});

export const slideGridStyles = StyleSheet.create({
  grid: {
    position: 'relative',
  },
  cellWrapper: {
    position: 'absolute',
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  tileBlank: {
    backgroundColor: 'transparent',
  },
  tileNum: {
    fontWeight: '800',
  },
});

export const slideOverStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: SLIDE_HORIZONTAL_PADDING,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2E2E2E',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    marginTop: 32,
    width: '100%',
    backgroundColor: '#F0EDE8',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAA',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTime: {
    fontSize: 52,
    fontWeight: '900',
    color: '#2E2E2E',
    letterSpacing: -2,
    marginTop: 4,
  },
  newBest: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#6EC6A8',
    letterSpacing: 0.3,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#DDD9D2',
    marginVertical: 20,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  statBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#AAA',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  /** Win card “Best” — title case, not all-caps */
  recordRowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#AAA',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#3D3D3D',
    marginTop: 2,
  },
  spacer: { flex: 1 },
  adWrap: {
    width: '100%',
    marginTop: 8,
    marginBottom: 12,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  btnPrimary: {
    width: '100%',
    minHeight: 56,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  btnPrimaryPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  btnPrimaryDisabled: {
    opacity: 0.55,
  },
  btnPrimaryText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FAF7F2',
    letterSpacing: 0.4,
  },
  btnSecondary: {
    width: '100%',
    minHeight: 48,
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C8C4BE',
  },
  btnSecondaryPressed: { opacity: 0.7 },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  starText: {
    fontSize: 30,
  },
  levelBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAA',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  lostHint: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  checkpointSaved: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6EC6A8',
    textAlign: 'center',
    marginBottom: 8,
  },
  checkpointMeta: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 17,
    paddingHorizontal: 8,
  },
});

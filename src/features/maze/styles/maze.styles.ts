import { StyleSheet } from 'react-native';

/** Horizontal padding shared by Path mode screens and grid width calculation. */
export const MAZE_HORIZONTAL_PADDING = 28;

/** Initial timer duration (ms), also used by the HUD bar. */
export const MAZE_TOTAL_TIME_MS = 60_000;

export const mazeCellStyles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  num: {
    fontWeight: '800',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export const mazeGridStyles = StyleSheet.create({
  grid: {
    position: 'relative',
  },
  cellWrapper: {
    position: 'absolute',
  },
  line: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
});

export const mazeTargetStyles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: 1.5,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  pill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  arrow: {
    fontSize: 18,
    color: '#888',
    lineHeight: 22,
  },
});

export const mazeHudStyles = StyleSheet.create({
  hud: {
    width: '100%',
    gap: 10,
  },
  topRow: {
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
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timerSecs: {
    fontSize: 15,
    fontWeight: '700',
    color: '#555',
    width: 28,
    textAlign: 'right',
  },
  timerSecsLow: {
    color: '#E57373',
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8E4DE',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export const mazeScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: MAZE_HORIZONTAL_PADDING,
    alignItems: 'center',
  },
  gameplay: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  targetSection: {
    width: '100%',
    alignItems: 'center',
  },
  gridWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const mazeOverStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: MAZE_HORIZONTAL_PADDING,
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
  cardScore: {
    fontSize: 56,
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
});

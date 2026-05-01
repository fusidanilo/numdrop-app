import { StyleSheet } from 'react-native';

export const devOverlayStyles = StyleSheet.create({
  sandboxRow: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(168,216,201,0.35)',
    borderWidth: 1,
    borderColor: '#A8D8C9',
    marginBottom: 4,
    maxWidth: '100%',
  },
  sandboxLocked: {
    opacity: 0.85,
  },
  sandboxPressed: {
    opacity: 0.75,
  },
  sandboxLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D6B5B',
    textAlign: 'center',
  },
  sandboxHint: {
    fontSize: 11,
    color: '#6B8B80',
    marginTop: 4,
  },
  devRibbonWrap: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 25,
  },
  devRibbon: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(45,107,91,0.92)',
  },
  devRibbonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FAF7F2',
    letterSpacing: 1,
  },
});

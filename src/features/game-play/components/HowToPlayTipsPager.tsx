import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { HowToPlayTip } from '@/game/config/howToPlayTips';

export interface HowToPlayTipsPagerProps {
  style?: StyleProp<ViewStyle>;
  /** Useful when the parent doesn't give a bounded width yet (e.g. flex layouts). */
  minHeight?: number;
  tips: readonly HowToPlayTip[];
}

export function HowToPlayTipsPager({
  style,
  minHeight = 0,
  tips,
}: HowToPlayTipsPagerProps) {
  const [pageWidth, setPageWidth] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && w !== pageWidth) setPageWidth(w);
  }, [pageWidth]);

  const onMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / pageWidth);
    setPageIndex(Math.max(0, Math.min(i, tips.length - 1)));
  }, [pageWidth, tips.length]);

  return (
    <View style={[styles.outer, minHeight > 0 && { minHeight }, style]} onLayout={onLayout}>
      {pageWidth > 0 && (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            decelerationRate="fast"
            style={{ width: pageWidth }}
            onMomentumScrollEnd={onMomentumEnd}
          >
            {tips.map((tip) => (
              <View key={tip.title} style={[styles.page, { width: pageWidth }]}>
                <View style={styles.card}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipBody}>{tip.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.dots} accessibilityRole="tablist">
            {tips.map((tip, i) => (
              <View
                key={tip.title}
                style={[styles.dot, i === pageIndex && styles.dotActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: i === pageIndex }}
              />
            ))}
          </View>
          <Text style={styles.pageHint} accessibilityLiveRegion="polite">
            {pageIndex + 1} / {tips.length}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    minHeight: 0,
    flexShrink: 0,
  },
  page: {
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E2E2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  tipBody: {
    fontSize: 14,
    color: '#555',
    lineHeight: 21,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  dotActive: {
    backgroundColor: '#2A6B59',
    width: 18,
    borderRadius: 4,
  },
  pageHint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#9A9A9A',
    textAlign: 'center',
  },
});

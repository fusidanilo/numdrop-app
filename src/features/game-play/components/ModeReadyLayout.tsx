import React, { type ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { HowToPlayTip } from '@/game/config/howToPlayTips';
import { HowToPlayTipsPager } from '@/features/game-play/components/HowToPlayTipsPager';
import { styles } from '@/features/game-play/styles/gameScreen.styles';

export interface ModeReadyLayoutProps {
  /** Shown under the tips pager (e.g. Classic sandbox toggle). */
  footerExtra?: ReactNode;
  onBack: () => void;
  onStart: () => void;
  paddingBottom: number;
  paddingTop: number;
  tips: readonly HowToPlayTip[];
  /** Defaults to translated "Ready?" */
  title?: string;
}

/**
 * Shared pre-game screen: "Ready?", swipeable tip cards, Start, Back.
 * Used by Classic (Numdrop) and Path modes.
 */
export function ModeReadyLayout({
  footerExtra,
  onBack,
  onStart,
  paddingBottom,
  paddingTop,
  tips,
  title,
}: ModeReadyLayoutProps) {
  const { t } = useTranslation('common');
  const heading = title ?? t('ready');

  return (
    <View style={[styles.readyScreenRoot, { paddingBottom, paddingTop }]}>
      <View style={styles.readyCenterColumn}>
        <View style={styles.readyCenterBundle}>
          <Text style={[styles.overlayTitle, styles.readyTitle]}>{heading}</Text>
          <HowToPlayTipsPager tips={tips} style={styles.readyTipsPager} />
        </View>
      </View>
      <View style={styles.readyFooterActions}>
        {footerExtra}
        <Pressable
          style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
          onPress={onStart}
        >
          <Text style={styles.startBtnText}>{t('start')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          onPress={onBack}
        >
          <Text style={styles.backBtnText}>{t('back')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

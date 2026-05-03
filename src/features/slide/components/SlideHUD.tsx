import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { slideHudStyles as styles } from '@/features/slide/styles/slide.styles';
import { nextCheckpointRound, CHECKPOINT_EVERY } from '@/features/slide/config/slideCampaign';

interface Props {
  elapsedMs: number;
  moves: number;
  moveBudget: number;
  round: number;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function SlideHUD({ elapsedMs, moves, moveBudget, round }: Props) {
  const { t } = useTranslation('slide');
  const remaining = Math.max(0, moveBudget - moves);
  const nextCp = nextCheckpointRound(round);

  return (
    <View style={styles.hud}>
      <View style={styles.metricBlock}>
        <Text style={styles.metricLabel}>{t('hudTime')}</Text>
        <Text style={styles.metricValue}>{formatTime(elapsedMs)}</Text>
      </View>

      <View style={[styles.metricBlock, styles.metricCenter]}>
        <Text style={styles.metricLabel}>{t('hudRound')}</Text>
        <Text style={styles.metricValue}>{round}</Text>
        <Text style={styles.metricCheckpoint}>
          {t('hudCheckpointHint', { next: nextCp, every: CHECKPOINT_EVERY })}
        </Text>
      </View>

      <View style={[styles.metricBlock, styles.metricRight]}>
        <Text style={styles.metricLabel}>{t('hudMoves')}</Text>
        <Text style={styles.metricValue}>{t('hudMovesOf', { used: moves, max: moveBudget })}</Text>
        <Text style={styles.metricMovesLeft}>{t('hudMovesLeft', { count: remaining })}</Text>
      </View>
    </View>
  );
}

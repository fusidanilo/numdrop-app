import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSlideStore } from '@/features/slide/store/slideStore';
import { AdMobBanner } from '@/ads/AdMobBanner';
import { isGoogleMobileAdsAvailable } from '@/ads/adMob';
import { showRewardedAd } from '@/ads/showRewardedAd';
import { COLORS, COLOR_ORDER } from '@/game/config/colors';
import { slideOverStyles as styles } from '@/features/slide/styles/slide.styles';
import { CHECKPOINT_EVERY } from '@/features/slide/config/slideCampaign';

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function SlideOverScreen() {
  const { t } = useTranslation(['common', 'slide']);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const elapsedMs = useSlideStore((s) => s.elapsedMs);
  const moves = useSlideStore((s) => s.moves);
  const moveBudget = useSlideStore((s) => s.moveBudget);
  const round = useSlideStore((s) => s.round);
  const roundTryIndex = useSlideStore((s) => s.roundTryIndex);
  const bestRoundEver = useSlideStore((s) => s.bestRoundEver);
  const winWasNewRoundRecord = useSlideStore((s) => s.winWasNewRoundRecord);
  const lastCheckpointRound = useSlideStore((s) => s.lastCheckpointRound);
  const lastResult = useSlideStore((s) => s.lastResult);
  const slideStatus = useSlideStore((s) => s.status);
  const advanceAfterWin = useSlideStore((s) => s.advanceAfterWin);
  const retryAfterLoss = useSlideStore((s) => s.retryAfterLoss);
  const retryAfterRewardedAd = useSlideStore((s) => s.retryAfterRewardedAd);
  const respawnFromCheckpoint = useSlideStore((s) => s.respawnFromCheckpoint);

  const [rewardedLoading, setRewardedLoading] = useState(false);

  const won = lastResult === 'won' || (lastResult === null && slideStatus === 'won');
  const lost = lastResult === 'lost' || (lastResult === null && slideStatus === 'lost');
  const adsAvailable = isGoogleMobileAdsAvailable();
  const canRetrySameRound = lost && roundTryIndex === 1;
  const showRewardedRetry = lost && roundTryIndex === 2 && adsAvailable;
  const checkpointPrimary = lost && !canRetrySameRound && !showRewardedRetry;

  const lostHintKey =
    roundTryIndex === 1
      ? 'slideOver.lostHint'
      : roundTryIndex === 2
        ? 'slideOver.lostHintAfterFree'
        : 'slideOver.lostHintFinal';

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);
  const btnsOpacity = useSharedValue(0);
  const btnsY = useSharedValue(16);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 400 });
    titleY.value = withTiming(0, { duration: 400 });
    cardScale.value = withDelay(150, withSpring(1, { damping: 14, stiffness: 120 }));
    cardOpacity.value = withDelay(150, withTiming(1, { duration: 300 }));
    btnsOpacity.value = withDelay(350, withTiming(1, { duration: 350 }));
    btnsY.value = withDelay(350, withTiming(0, { duration: 350 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const btnsStyle = useAnimatedStyle(() => ({
    opacity: btnsOpacity.value,
    transform: [{ translateY: btnsY.value }],
  }));

  const goSlide = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace('/slide' as any);
  };

  const handleNextRound = () => {
    advanceAfterWin();
    goSlide();
  };

  const handleRetryPuzzle = () => {
    retryAfterLoss();
    goSlide();
  };

  const handleRewardedRetry = async () => {
    setRewardedLoading(true);
    try {
      const ok = await showRewardedAd();
      if (ok) {
        retryAfterRewardedAd();
        goSlide();
      }
    } finally {
      setRewardedLoading(false);
    }
  };

  const handleFromCheckpoint = () => {
    respawnFromCheckpoint();
    goSlide();
  };

  const handleHome = () => {
    useSlideStore.getState().resetToIdle();
    router.replace('/');
  };

  const subtitleText = lost
    ? t('slideOver.lostSubtitle', { ns: 'slide' })
    : t('slideOver.winSubtitle', { ns: 'slide' });

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <View style={styles.dotsRow}>
        {COLOR_ORDER.map((c) => (
          <View key={c} style={[styles.dot, { backgroundColor: COLORS[c].tile }]} />
        ))}
      </View>

      <Animated.Text style={[styles.title, titleStyle]}>
        {lost ? t('slideOver.lostTitle', { ns: 'slide' }) : t('slideOver.modeTitle', { ns: 'slide' })}
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, titleStyle]}>{subtitleText}</Animated.Text>

      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.levelBadge}>
          {lost
            ? t('slideOver.roundFailed', { ns: 'slide', round })
            : t('slideOver.roundCleared', { ns: 'slide', round })}
        </Text>

        {!lost && round % CHECKPOINT_EVERY === 0 && (
          <Text style={styles.checkpointSaved}>
            {t('slideOver.checkpointSaved', { ns: 'slide', round })}
          </Text>
        )}

        {lost ? (
          <>
            <Text style={styles.lostHint}>{t(lostHintKey, { ns: 'slide' })}</Text>
            <Text style={styles.checkpointMeta}>
              {lastCheckpointRound > 0
                ? t('slideOver.checkpointStatusSaved', {
                    ns: 'slide',
                    last: lastCheckpointRound,
                    every: CHECKPOINT_EVERY,
                  })
                : t('slideOver.checkpointStatusNone', { ns: 'slide', every: CHECKPOINT_EVERY })}
            </Text>
            <Text style={styles.cardLabel}>{t('slideOver.movesLimitLabel', { ns: 'slide' })}</Text>
            <Text style={styles.cardTime}>
              {t('slideOver.movesUsedOfMax', { ns: 'slide', used: moves, max: moveBudget })}
            </Text>
            <Text style={styles.cardLabel}>{t('slideOver.timeLabel', { ns: 'slide' })}</Text>
            <Text style={styles.statValue}>{formatTime(elapsedMs)}</Text>
          </>
        ) : (
          <>
            {winWasNewRoundRecord && (
              <Text style={styles.newBest}>{t('slideOver.newRoundRecord', { ns: 'slide' })}</Text>
            )}
            <Text style={styles.cardLabel}>{t('slideOver.timeLabel', { ns: 'slide' })}</Text>
            <Text style={styles.cardTime}>{formatTime(elapsedMs)}</Text>
            <View style={styles.divider} />
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.recordRowLabel}>{t('slideOver.recordLabel', { ns: 'slide' })}</Text>
                <Text style={styles.statValue}>
                  {Math.max(bestRoundEver, round) > 0
                    ? t('slideOver.recordBestRound', {
                        ns: 'slide',
                        round: Math.max(bestRoundEver, round),
                      })
                    : '—'}
                </Text>
              </View>
              <View style={[styles.statBlock, styles.statRight]}>
                <Text style={styles.statLabel}>{t('slideOver.movesLabel', { ns: 'slide' })}</Text>
                <Text style={styles.statValue}>{moves}</Text>
              </View>
            </View>
          </>
        )}
      </Animated.View>

      <View style={styles.spacer} />

      <View style={styles.adWrap}>
        <AdMobBanner />
      </View>

      <Animated.View style={[styles.buttons, btnsStyle]}>
        {won && (
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
            onPress={handleNextRound}
          >
            <Text style={styles.btnPrimaryText}>{t('slideOver.nextRound', { ns: 'slide' })}</Text>
          </Pressable>
        )}

        {lost && canRetrySameRound && (
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
            onPress={handleRetryPuzzle}
          >
            <Text style={styles.btnPrimaryText}>{t('slideOver.retryPuzzle', { ns: 'slide' })}</Text>
          </Pressable>
        )}

        {lost && showRewardedRetry && (
          <Pressable
            disabled={rewardedLoading}
            style={({ pressed }) => [
              styles.btnPrimary,
              rewardedLoading ? styles.btnPrimaryDisabled : pressed && styles.btnPrimaryPressed,
            ]}
            onPress={handleRewardedRetry}
          >
            {rewardedLoading ? (
              <ActivityIndicator color="#FAF7F2" />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {t('slideOver.retryRewarded', { ns: 'slide' })}
              </Text>
            )}
          </Pressable>
        )}

        {lost && (
          <Pressable
            style={({ pressed }) => [
              checkpointPrimary ? styles.btnPrimary : styles.btnSecondary,
              pressed &&
                (checkpointPrimary ? styles.btnPrimaryPressed : styles.btnSecondaryPressed),
            ]}
            onPress={handleFromCheckpoint}
          >
            <Text
              style={checkpointPrimary ? styles.btnPrimaryText : styles.btnSecondaryText}
            >
              {t('slideOver.fromCheckpoint', { ns: 'slide' })}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
          onPress={handleHome}
        >
          <Text style={styles.btnSecondaryText}>{t('home')}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

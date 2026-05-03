import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  BackHandler,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSlideStore } from '@/features/slide/store/slideStore';
import { useSlideTimer } from '@/features/slide/hooks/useSlideTimer';
import { useSlideAndroidBack } from '@/features/slide/hooks/useSlideAndroidBack';
import { SlideGrid } from '@/features/slide/components/SlideGrid';
import { SlideHUD } from '@/features/slide/components/SlideHUD';
import { ModeReadyLayout } from '@/features/game-play/components/ModeReadyLayout';
import { styles as pauseMenuStyles } from '@/features/game-play/styles/gameScreen.styles';
import type { HowToPlayTip } from '@/game/config/howToPlayTips';
import {
  SLIDE_HORIZONTAL_PADDING,
  slideScreenStyles as styles,
  slideReadyStyles as readyStyles,
} from '@/features/slide/styles/slide.styles';

export default function SlideScreen() {
  const { t, i18n } = useTranslation(['slide', 'game', 'common']);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const slideTips = useMemo(
    () => t('tipsSlide', { returnObjects: true }) as HowToPlayTip[],
    [t, i18n.language],
  );

  const status = useSlideStore((s) => s.status);
  const elapsedMs = useSlideStore((s) => s.elapsedMs);
  const moves = useSlideStore((s) => s.moves);
  const moveBudget = useSlideStore((s) => s.moveBudget);
  const round = useSlideStore((s) => s.round);
  const isPaused = useSlideStore((s) => s.isPaused);
  const startRun = useSlideStore((s) => s.startRun);
  const startFromSavedCheckpoint = useSlideStore((s) => s.startFromSavedCheckpoint);
  const savedCheckpointRound = useSlideStore((s) => s.savedCheckpointRound);
  const restartFullRun = useSlideStore((s) => s.restartFullRun);
  const setPaused = useSlideStore((s) => s.setPaused);
  const resetToIdle = useSlideStore((s) => s.resetToIdle);
  const loadEndless = useSlideStore((s) => s.loadEndless);

  const readyCheckpointFooter = useMemo(() => {
    if (savedCheckpointRound < 1) return undefined;
    return (
      <Pressable
        style={({ pressed }) => [
          readyStyles.checkpointBtn,
          pressed && readyStyles.checkpointBtnPressed,
        ]}
        onPress={() => startFromSavedCheckpoint()}
      >
        <Text style={readyStyles.checkpointBtnText}>
          {t('startFromCheckpoint', { last: savedCheckpointRound })}
        </Text>
      </Pressable>
    );
  }, [savedCheckpointRound, startFromSavedCheckpoint, t]);

  const handleBackHome = useCallback(() => {
    resetToIdle();
    router.replace('/');
  }, [resetToIdle, router]);

  useEffect(() => {
    void loadEndless();
  }, [loadEndless]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (status !== 'idle') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackHome();
      return true;
    });
    return () => sub.remove();
  }, [status, handleBackHome]);

  useSlideTimer();

  const openPauseMenu = useCallback(() => setPaused(true), [setPaused]);
  const resumeFromMenu = useCallback(() => setPaused(false), [setPaused]);
  const restartFromMenu = useCallback(() => restartFullRun(), [restartFullRun]);
  const quitToHomeFromMenu = useCallback(() => {
    setPaused(false);
    resetToIdle();
    router.replace('/');
  }, [setPaused, resetToIdle, router]);

  useSlideAndroidBack(openPauseMenu);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      const { status: st, isPaused: paused } = useSlideStore.getState();
      if (st !== 'playing' || paused) return;
      e.preventDefault();
      useSlideStore.getState().setPaused(true);
    });
    return unsub;
  }, [navigation]);

  const gridOuterSize = width - SLIDE_HORIZONTAL_PADDING * 2;

  if (status === 'idle') {
    return (
      <ModeReadyLayout
        title={t('slideReadyTitle')}
        startButtonLabel={t('startEndless')}
        footerExtra={readyCheckpointFooter}
        onBack={handleBackHome}
        onStart={() => startRun()}
        paddingBottom={insets.bottom + 12}
        paddingTop={insets.top + 10}
        tips={slideTips}
      />
    );
  }

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.gameplay}>
        <SlideHUD
          elapsedMs={elapsedMs}
          moves={moves}
          moveBudget={moveBudget}
          round={round}
        />

        <View style={styles.gridWrapper}>
          <SlideGrid outerSize={gridOuterSize} />
        </View>
      </View>

      {isPaused && (
        <View
          style={[
            pauseMenuStyles.menuOverlay,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
              paddingLeft: insets.left + 20,
              paddingRight: insets.right + 20,
            },
          ]}
        >
          <View style={pauseMenuStyles.menuInner}>
            <View style={[pauseMenuStyles.menuCard, { maxHeight: height * 0.84 }]}>
              <Text style={pauseMenuStyles.menuTitle}>{t('pause.title', { ns: 'game' })}</Text>
              <Text style={pauseMenuStyles.menuSubtitle}>{t('pause.subtitle', { ns: 'game' })}</Text>
              <Pressable
                style={({ pressed }) => [
                  pauseMenuStyles.menuBtn,
                  pauseMenuStyles.menuBtnPrimary,
                  pressed && pauseMenuStyles.menuBtnPrimaryPressed,
                ]}
                onPress={resumeFromMenu}
              >
                <Text style={pauseMenuStyles.menuBtnPrimaryText}>
                  {t('pause.resume', { ns: 'game' })}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  pauseMenuStyles.menuBtn,
                  pauseMenuStyles.menuBtnSecondary,
                  pressed && pauseMenuStyles.menuBtnSecondaryPressed,
                ]}
                onPress={restartFromMenu}
              >
                <Text style={pauseMenuStyles.menuBtnSecondaryText}>
                  {t('pause.newGame', { ns: 'game' })}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  pauseMenuStyles.menuBtnGhost,
                  pressed && pauseMenuStyles.menuBtnGhostPressed,
                ]}
                onPress={quitToHomeFromMenu}
              >
                <Text style={pauseMenuStyles.menuBtnGhostText}>
                  {t('pause.exitHome', { ns: 'game' })}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

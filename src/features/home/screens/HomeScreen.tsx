import React, { useEffect } from 'react';
import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/game/store/gameStore';
import { useMazeStore } from '@/features/maze/store/mazeStore';
import { useTraceStore } from '@/features/trace/store/traceStore';
import { useSlideStore } from '@/features/slide/store/slideStore';
import { useHydrateHighScore } from '@/features/home/hooks/useHydrateHighScore';
import { styles } from '@/features/home/styles/home.styles';
import { ONLY_CLASSIC_MODE } from '@/game/config/modesAvailability';

export default function HomeScreen() {
  const { t } = useTranslation(['common', 'home']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const highScore = useGameStore((s) => s.highScore);
  const mazeHighScore = useMazeStore((s) => s.highScore);
  const loadMazeHighScore = useMazeStore((s) => s.loadHighScore);
  const traceHighScore = useTraceStore((s) => s.highScore);
  const loadTraceHighScore = useTraceStore((s) => s.loadHighScore);
  const slideBestRound = useSlideStore((s) => s.bestRoundEver);
  const loadEndless = useSlideStore((s) => s.loadEndless);

  const slideHasRecord = slideBestRound > 0;

  useHydrateHighScore();

  useEffect(() => {
    if (ONLY_CLASSIC_MODE) return;
    void loadMazeHighScore();
    void loadTraceHighScore();
    void loadEndless();
  }, [loadMazeHighScore, loadTraceHighScore, loadEndless]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.modeScroll}
        contentContainerStyle={[
          styles.modeScrollContent,
          { paddingTop: 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../../../../assets/logo-extended-no-bg.png')}
          style={styles.logo}
          accessibilityRole="image"
          accessibilityLabel={t('appName')}
        />

        <Text style={styles.title}>{t('appName')}</Text>

        <View style={styles.modeMenu}>
          {!ONLY_CLASSIC_MODE && <Text style={styles.chooseModeLabel}>{t('chooseMode')}</Text>}
          <Pressable
            style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
            onPress={() => router.push('/game')}
          >
            <Text style={styles.modeName}>{t('classicTitle')}</Text>
            <Text style={styles.modeDescription}>{t('classicDesc')}</Text>
            {highScore > 0 && (
              <View style={styles.modeBestRow}>
                <Text style={styles.modeBestLabel}>{t('best')}</Text>
                <Text style={styles.modeBestValue}>{highScore}</Text>
              </View>
            )}
          </Pressable>

          {!ONLY_CLASSIC_MODE && (
            <>
              <Pressable
                style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onPress={() => {
                  useMazeStore.getState().resetToIdle();
                  router.push('/maze' as any);
                }}
              >
                <Text style={styles.modeName}>{t('pathTitle')}</Text>
                <Text style={styles.modeDescription}>{t('pathDesc')}</Text>
                {mazeHighScore > 0 && (
                  <View style={styles.modeBestRow}>
                    <Text style={styles.modeBestLabel}>{t('best')}</Text>
                    <Text style={styles.modeBestValue}>{mazeHighScore}</Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onPress={() => {
                  useTraceStore.getState().resetToIdle();
                  router.push('/trace' as any);
                }}
              >
                <Text style={styles.modeName}>{t('traceTitle')}</Text>
                <Text style={styles.modeDescription}>{t('traceDesc')}</Text>
                {traceHighScore > 0 && (
                  <View style={styles.modeBestRow}>
                    <Text style={styles.modeBestLabel}>{t('best')}</Text>
                    <Text style={styles.modeBestValue}>{traceHighScore}</Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onPress={() => {
                  useSlideStore.getState().resetToIdle();
                  router.push('/slide' as any);
                }}
              >
                <Text style={styles.modeName}>{t('slideTitle')}</Text>
                <Text style={styles.modeDescription}>{t('slideDesc')}</Text>
                {slideHasRecord && (
                  <View style={styles.modeBestRow}>
                    <Text style={styles.modeBestLabelPlain}>{t('slideBest')}</Text>
                    <Text style={styles.modeBestValue}>
                      {t('slideBestValue', { round: slideBestRound, ns: 'home' })}
                    </Text>
                  </View>
                )}
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

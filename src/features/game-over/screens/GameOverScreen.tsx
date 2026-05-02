import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useGameStore } from '@/game/store/gameStore';
import { COLORS, COLOR_ORDER } from '@/game/config/colors';
import { getBannerAdUnitId, isGoogleMobileAdsAvailable } from '@/ads/adMob';
import { useGameOverEntryAnimations } from '@/features/game-over/hooks/useGameOverEntryAnimations';
import { styles } from '@/features/game-over/styles/gameOver.styles';

export default function GameOverScreen() {
  const { t } = useTranslation(['common', 'game']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const startGame = useGameStore((s) => s.startGame);
  const isNewBest = score > 0 && score >= highScore;

  const { titleStyle, scoreStyle, btnsStyle } = useGameOverEntryAnimations();

  const handlePlayAgain = () => {
    startGame();
    router.replace('/game');
  };

  const handleHome = () => {
    useGameStore.setState({ status: 'idle' });
    router.replace('/');
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <View style={styles.dotsRow}>
        {COLOR_ORDER.map((c) =>
          React.createElement(View, {
            key: c,
            style: [styles.dot, { backgroundColor: COLORS[c].tile }],
          }),
        )}
      </View>

      <Animated.Text style={[styles.gameOverTitle, titleStyle]}>
        {t('gameOverTitle')}
      </Animated.Text>

      <Animated.View style={[styles.scoreCard, scoreStyle]}>
        <Text style={styles.scoreLabel}>{t('gameOver.scoreLabel')}</Text>
        <Text style={styles.scoreValue}>{score}</Text>
        {isNewBest && <Text style={styles.newBest}>{t('newBest')}</Text>}
        <View style={styles.divider} />
        <Text style={styles.bestLabel}>{t('gameOver.bestLabel')}</Text>
        <Text style={styles.bestValue}>{highScore}</Text>
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View style={[styles.buttons, btnsStyle]}>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
          onPress={handlePlayAgain}
        >
          <Text style={styles.btnPrimaryText}>{t('playAgain')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
          onPress={handleHome}
        >
          <Text style={styles.btnSecondaryText}>{t('home')}</Text>
        </Pressable>
      </Animated.View>
      <View style={styles.adWrap}>
        <AdMobBanner />
      </View>
    </View>
  );
}

function AdMobBanner() {
  if (!isGoogleMobileAdsAvailable()) {
    return null;
  }

  const adsModule = require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
  const BannerAd = adsModule.BannerAd;
  const bannerSize = adsModule.BannerAdSize.BANNER;

  return <BannerAd unitId={getBannerAdUnitId()} size={bannerSize} />;
}

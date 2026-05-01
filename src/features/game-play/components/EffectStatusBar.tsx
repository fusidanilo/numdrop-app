import React, { memo, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useGameStore } from '@/game/store/gameStore';
import { effectBarStyles } from '@/features/game-play/styles/effectStatusBar.styles';

/**
 * Pixel sotto il safe-area top dove iniziare la riga effetti (padding HUD + riga punteggio+dots + paddingBottom).
 * Aggiorna se cambi layout HUD.
 */
export const EFFECT_STATUS_BAR_TOP_OFFSET = 82;

interface EffectStatusBarProps {
  /** tipico: `insets.top + EFFECT_STATUS_BAR_TOP_OFFSET` */
  top: number;
}

function EffectStatusBarComponent({ top }: EffectStatusBarProps) {
  const activeEffect = useGameStore((s) => s.activeEffect);
  const shieldActive = useGameStore((s) => s.shieldActive);
  const [, bump] = useState(0);

  useEffect(() => {
    if (!activeEffect) return;
    const id = setInterval(() => bump((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [activeEffect]);

  const showShield = shieldActive;

  let remainingSec = 0;
  let showFreeze = false;
  if (activeEffect?.type === 'freeze') {
    remainingSec = Math.max(0, Math.ceil((activeEffect.expiresAt - Date.now()) / 1000));
    showFreeze = remainingSec > 0;
  }

  if (!showShield && !showFreeze) return null;

  return (
    <View style={[effectBarStyles.bar, { top }]} pointerEvents="none">
      {showShield && (
        <View style={[effectBarStyles.chip, { zIndex: 1, backgroundColor: '#E8EAF6' }]}>
          <Text style={[effectBarStyles.chipText, { color: '#3949AB' }]}>
            🛡️ SHIELD · next hit safe
          </Text>
        </View>
      )}
      {showFreeze && (
        <View style={[effectBarStyles.chip, { zIndex: 2, backgroundColor: '#B3E5FC' }]}>
          <Text style={[effectBarStyles.chipText, { color: '#01579B' }]}>
            ❄️ FREEZE · {remainingSec}s
          </Text>
        </View>
      )}
    </View>
  );
}

export const EffectStatusBar = memo(EffectStatusBarComponent);

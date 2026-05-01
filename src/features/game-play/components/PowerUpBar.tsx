import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useGameStore } from '@/game/store/gameStore';
import type { PowerUps } from '@/game/store/gameStore';
import { powerUpBarStyles as puStyles } from '@/features/game-play/styles/powerUpBar.styles';

export interface PowerUpBarProps {
  onActivate: (type: keyof PowerUps) => void;
}

const POWER_UP_DEFS: Array<{
  type: keyof PowerUps;
  icon: string;
  label: string;
}> = [
  { type: 'freeze', icon: '❄️', label: 'Freeze' },
  { type: 'shield', icon: '🛡️', label: 'Shield' },
  { type: 'bomb', icon: '💣', label: 'Bomb' },
];

export function PowerUpBar({ onActivate }: PowerUpBarProps) {
  const powerUps = useGameStore((s) => s.powerUps);
  const shieldActive = useGameStore((s) => s.shieldActive);
  const activeEffect = useGameStore((s) => s.activeEffect);

  const visible = POWER_UP_DEFS.some((d) => powerUps[d.type] > 0);
  if (!visible) return null;

  return (
    <View style={puStyles.bar} pointerEvents="box-none">
      {POWER_UP_DEFS.map((d, index) => {
        const charges = powerUps[d.type];
        if (charges <= 0) return null;
        const isActive =
          d.type === 'shield'
            ? shieldActive
            : d.type === 'freeze'
              ? activeEffect?.type === 'freeze'
              : false;
        const blockReuse =
          (d.type === 'freeze' &&
            activeEffect?.type === 'freeze' &&
            activeEffect.expiresAt > Date.now()) ||
          (d.type === 'shield' && shieldActive);
        return (
          <View key={d.type} style={[puStyles.btnShadow, { zIndex: index + 1 }]}>
            <Pressable
              disabled={blockReuse}
              style={({ pressed }) => [
                puStyles.btnFace,
                isActive && puStyles.btnFaceActive,
                blockReuse && puStyles.btnFaceReuseBlocked,
                pressed && !blockReuse && puStyles.btnFacePressed,
              ]}
              onPress={() => onActivate(d.type)}
            >
              <View style={puStyles.iconSlot}>
                <Text style={puStyles.icon} allowFontScaling={false}>
                  {d.icon}
                </Text>
              </View>
              {charges > 1 && (
                <View style={puStyles.badge}>
                  <Text style={puStyles.badgeText}>{charges}</Text>
                </View>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

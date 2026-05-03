import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  covered: number;
  total: number;
}

export function TraceProgressHint({ covered, total }: Props) {
  const { t } = useTranslation('trace');

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('progressLabel')}</Text>
      <Text style={styles.value}>{t('progressValue', { covered, total })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: 1.5,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: '#555',
    letterSpacing: -0.3,
  },
});

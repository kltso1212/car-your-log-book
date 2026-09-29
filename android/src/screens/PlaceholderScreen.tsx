import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useVehicles } from '../context';

// Covers 保養 / 隧道 / 泊車 / 罰款 until those APIs exist —
// same "Coming Soon" behaviour as the reactjs tab pages.
export default function PlaceholderScreen({ title }: { title: string }) {
  const { currentVehicle } = useVehicles();
  return (
    <View style={styles.root}>
      {!!currentVehicle && (
        <Text style={styles.heading}>
          {currentVehicle}的{title}記錄
        </Text>
      )}
      <Text>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  heading: { fontSize: 18, fontWeight: '600' },
});

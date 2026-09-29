import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { initDatabase } from './src/db/database';
import { listVehicles } from './src/db/vehicles';
import { VehicleContext, useVehicles } from './src/context';
import VehicleBar from './src/components/VehicleBar';
import FuelScreen from './src/screens/FuelScreen';
import ChargeScreen from './src/screens/ChargeScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import { ELECTRIC_TYPE, pages, vehicleTypeOf, type Vehicle } from './src/data';

const Tab = createBottomTabNavigator();

// Bottom-tab graphics: react-native SafeAreaView is iOS-only, so the
// provider version below is what keeps the title clear of the status bar.
const tabEmojis = ['🚗', '⛽', '🔋', '🔧', '🛡️', '📜', '🚇', '🅿️', '💸'] as const;

function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={[styles.icon, focused ? null : styles.iconDim]}>{emoji}</Text>
  );
}

// Tab bar height for icon + label; the phone's bottom inset (gesture bar /
// system buttons) is added on top so the bar sticks just above it,
// never underneath.
const TAB_BAR_HEIGHT = 60;

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { vehicles, currentVehicle } = useVehicles();
  // Electric vehicles charge instead of refuelling: show 充電, hide 入油.
  // Every other type shows 入油 and hides 充電.
  const isElectric = vehicleTypeOf(vehicles, currentVehicle) === ELECTRIC_TYPE;
  const show = (slug: 'fuel' | 'charge') =>
    slug === 'charge' ? isElectric : !isElectric;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}>
      <Tab.Screen
        name={pages[0]}
        component={SummaryScreen}
        options={{ tabBarIcon: tabIcon(tabEmojis[0]!) }}
      />
      {show('fuel') && (
        <Tab.Screen
          name={pages[1]}
          component={FuelScreen}
          options={{ tabBarIcon: tabIcon(tabEmojis[1]!) }}
        />
      )}
      {show('charge') && (
        <Tab.Screen
          name={pages[2]}
          component={ChargeScreen}
          options={{ tabBarIcon: tabIcon(tabEmojis[2]!) }}
        />
      )}
      <Tab.Screen
        name={pages[3]}
        options={{ tabBarIcon: tabIcon(tabEmojis[3]!) }}>
        {() => <PlaceholderScreen title={pages[3]!} />}
      </Tab.Screen>
      <Tab.Screen
        name={pages[4]}
        options={{ tabBarIcon: tabIcon(tabEmojis[4]!) }}>
        {() => <PlaceholderScreen title={pages[4]!} />}
      </Tab.Screen>
      <Tab.Screen
        name={pages[5]}
        options={{ tabBarIcon: tabIcon(tabEmojis[5]!) }}>
        {() => <PlaceholderScreen title={pages[5]!} />}
      </Tab.Screen>
      <Tab.Screen
        name={pages[6]}
        options={{ tabBarIcon: tabIcon(tabEmojis[6]!) }}>
        {() => <PlaceholderScreen title={pages[6]!} />}
      </Tab.Screen>
      <Tab.Screen
        name={pages[7]}
        options={{ tabBarIcon: tabIcon(tabEmojis[7]!) }}>
        {() => <PlaceholderScreen title={pages[7]!} />}
      </Tab.Screen>
      <Tab.Screen
        name={pages[8]}
        options={{ tabBarIcon: tabIcon(tabEmojis[8]!) }}>
        {() => <PlaceholderScreen title={pages[8]!} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentVehicle, setCurrentVehicle] = useState('');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const reloadVehicles = useCallback(async () => {
    try {
      const list = await listVehicles();
      setVehicles(list);
      setCurrentVehicle(prev => (prev && list.some(v => v.id === prev) ? prev : ''));
      setFailed(false);
    } catch {
      setFailed(true);
      setVehicles([]);
    }
  }, []);

  useEffect(() => {
    initDatabase()
      .then(reloadVehicles)
      .catch(() => {
        setFailed(true);
        setVehicles([]);
      })
      .finally(() => setReady(true));
  }, [reloadVehicles]);

  return (
    <SafeAreaProvider>
      {/* Bottom edge excluded: the tab bar adds the system inset itself,
          otherwise the gap doubles. */}
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <VehicleContext.Provider value={{ vehicles, setVehicles, currentVehicle, setCurrentVehicle }}>
          <Text style={styles.header}>🚗養車課金記錄⛽</Text>
          {!ready ? (
            <Text>正在載入...</Text>
          ) : failed ? (
            <Text>載入失敗!</Text>
          ) : (
            <>
              <VehicleBar />
              <NavigationContainer>
                <MainTabs />
              </NavigationContainer>
            </>
          )}
        </VehicleContext.Provider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { fontSize: 20, fontWeight: '700', textAlign: 'center', paddingVertical: 8 },
  icon: { fontSize: 22 },
  iconDim: { opacity: 0.45 },
});

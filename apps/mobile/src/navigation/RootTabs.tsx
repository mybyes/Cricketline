import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { HomeScreen } from '../screens/HomeScreen'
import { UpcomingScreen } from '../screens/UpcomingScreen'
import { FavoritesScreen } from '../screens/FavoritesScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { ScoreboardScreen } from '../screens/ScoreboardScreen'
import type { RootStackParamList, RootTabParamList } from '../types/match'
import { colors } from '../theme/colors'

const Tab = createBottomTabNavigator<RootTabParamList>()
const Stack = createNativeStackNavigator<RootStackParamList>()

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Live: '⚡', Upcoming: '📅', Favorites: '★', Settings: '⚙' }
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconOn]}>{icons[label] ?? '•'}</Text>
      {focused && <View style={styles.indicator} />}
    </View>
  )
}

function MatchStack({ listScreen: ListScreen }: { listScreen: React.ComponentType }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Home" component={ListScreen as any} />
      <Stack.Screen name="Scoreboard" component={ScoreboardScreen} />
    </Stack.Navigator>
  )
}

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Live" options={{ title: 'Live' }}>{() => <MatchStack listScreen={HomeScreen} />}</Tab.Screen>
      <Tab.Screen name="Upcoming" options={{ title: 'Fixtures' }}>{() => <MatchStack listScreen={UpcomingScreen} />}</Tab.Screen>
      <Tab.Screen name="Favorites" options={{ title: 'Saved' }}>{() => <MatchStack listScreen={FavoritesScreen} />}</Tab.Screen>
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'More' }} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1, height: 58, paddingBottom: 6 },
  tabItem: { alignItems: 'center', paddingTop: 4 },
  tabIcon: { fontSize: 18, opacity: 0.45 },
  tabIconOn: { opacity: 1 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  indicator: { position: 'absolute', top: 0, width: 28, height: 3, backgroundColor: colors.header, borderRadius: 2 },
})

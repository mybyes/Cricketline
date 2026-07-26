import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StyleSheet, View } from 'react-native'
import { HomeScreen } from '../screens/HomeScreen'
import { MatchesScreen } from '../screens/MatchesScreen'
import { SeriesScreen } from '../screens/SeriesScreen'
import { FavoritesScreen } from '../screens/FavoritesScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { ScoreboardScreen } from '../screens/ScoreboardScreen'
import { SeriesTableScreen } from '../screens/SeriesTableScreen'
import type { RootStackParamList, RootTabParamList } from '../types/match'
import { colors } from '../theme/colors'

const Tab = createBottomTabNavigator<RootTabParamList>()
const Stack = createNativeStackNavigator<RootStackParamList>()

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Matches: 'calendar-outline',
  Series: 'trophy-outline',
  More: 'ellipsis-horizontal',
}

function TabIcon({ route, focused }: { route: string; focused: boolean }) {
  const name = TAB_ICONS[route] ?? 'ellipse'
  return (
    <View style={styles.tabItem}>
      <Ionicons name={name} size={22} color={focused ? colors.tabActive : colors.tabInactive} />
      {focused && <View style={styles.indicator} />}
    </View>
  )
}

function MatchStack({ listScreen: ListScreen }: { listScreen: React.ComponentType }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="List" component={ListScreen as any} />
      <Stack.Screen name="Scoreboard" component={ScoreboardScreen} />
      <Stack.Screen name="SeriesTable" component={SeriesTableScreen} />
    </Stack.Navigator>
  )
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="MoreHome" component={SettingsScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Scoreboard" component={ScoreboardScreen} />
      <Stack.Screen name="SeriesTable" component={SeriesTableScreen} />
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
        tabBarIcon: ({ focused }) => <TabIcon route={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" options={{ title: 'Home' }}>{() => <MatchStack listScreen={HomeScreen} />}</Tab.Screen>
      <Tab.Screen name="Matches" options={{ title: 'Matches' }}>{() => <MatchStack listScreen={MatchesScreen} />}</Tab.Screen>
      <Tab.Screen name="Series" options={{ title: 'Series' }}>{() => <MatchStack listScreen={SeriesScreen} />}</Tab.Screen>
      <Tab.Screen name="More" component={MoreStack} options={{ title: 'More' }} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 56,
    paddingBottom: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: { alignItems: 'center', paddingTop: 4 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  indicator: { position: 'absolute', top: 0, width: 22, height: 2, backgroundColor: colors.accent, borderRadius: 1 },
})

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text, StyleSheet } from 'react-native'
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
  const icons: Record<string, string> = {
    Live: '⚡',
    Upcoming: '📅',
    Favorites: '★',
    Settings: '⚙',
  }
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      {icons[label] ?? '•'}
    </Text>
  )
}

function MatchStack({ listScreen: ListScreen }: { listScreen: React.ComponentType }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
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
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Live" options={{ title: 'Live' }}>
        {() => <MatchStack listScreen={HomeScreen} />}
      </Tab.Screen>
      <Tab.Screen name="Upcoming" options={{ title: 'Upcoming' }}>
        {() => <MatchStack listScreen={UpcomingScreen} />}
      </Tab.Screen>
      <Tab.Screen name="Favorites" options={{ title: 'Favorites' }}>
        {() => <MatchStack listScreen={FavoritesScreen} />}
      </Tab.Screen>
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  tabIcon: { fontSize: 20, opacity: 0.5 },
  tabIconFocused: { opacity: 1 },
})

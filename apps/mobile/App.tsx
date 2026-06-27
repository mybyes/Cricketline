import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/context/AuthContext'
import { FavoritesProvider } from './src/context/FavoritesContext'
import { useNotificationNavigation } from './src/hooks/useNotificationNavigation'
import { navigationRef } from './src/navigation/navigationRef'
import { RootTabs } from './src/navigation/RootTabs'
import { colors } from './src/theme/colors'

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.header,
  },
}

function AppRoot() {
  useNotificationNavigation()
  return <RootTabs />
}

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <NavigationContainer ref={navigationRef} theme={theme}>
          <StatusBar style="light" />
          <AppRoot />
        </NavigationContainer>
      </FavoritesProvider>
    </AuthProvider>
  )
}

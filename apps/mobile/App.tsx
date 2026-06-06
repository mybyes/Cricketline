import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { FavoritesProvider } from './src/context/FavoritesContext'
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

export default function App() {
  return (
    <FavoritesProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="light" />
        <RootTabs />
      </NavigationContainer>
    </FavoritesProvider>
  )
}

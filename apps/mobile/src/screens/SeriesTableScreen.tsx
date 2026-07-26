import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TablePanel } from '../components/panels/TablePanel'
import type { RootStackParamList } from '../types/match'
import { colors } from '../theme/colors'

type Route = RouteProp<RootStackParamList, 'SeriesTable'>

export function SeriesTableScreen() {
  const navigation = useNavigation()
  const { seriesId, seriesName } = useRoute<Route>().params

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.nav}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <Text style={styles.title} numberOfLines={2}>{seriesName ?? 'Points table'}</Text>
      </SafeAreaView>
      <View style={styles.body}>
        <TablePanel seriesId={seriesId} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safeTop: { backgroundColor: colors.header },
  nav: { paddingHorizontal: 16, paddingTop: 4 },
  backBtn: { paddingVertical: 4, minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '800', color: '#fff', paddingHorizontal: 16, paddingBottom: 12 },
  body: { flex: 1, padding: 12 },
})

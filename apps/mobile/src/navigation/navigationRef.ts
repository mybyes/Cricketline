import { createNavigationContainerRef } from '@react-navigation/native'
import type { RootStackParamList, RootTabParamList } from '../types/match'

export type AppParamList = RootTabParamList & {
  Live: { screen: keyof RootStackParamList; params?: RootStackParamList['Scoreboard'] }
}

export const navigationRef = createNavigationContainerRef<RootTabParamList>()

export function openMatchFromNotification(matchId: string, matchName = 'Live match') {
  if (!navigationRef.isReady()) return
  navigationRef.navigate('Live', {
    screen: 'Scoreboard',
    params: { matchId, matchName },
  } as never)
}

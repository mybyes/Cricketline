import { createNavigationContainerRef } from '@react-navigation/native'
import type { RootTabParamList } from '../types/match'

export const navigationRef = createNavigationContainerRef<RootTabParamList>()

export function openMatchFromNotification(matchId: string, matchName = 'Live match') {
  if (!navigationRef.isReady()) return
  navigationRef.navigate('Home', {
    screen: 'Scoreboard',
    params: { matchId, matchName },
  } as never)
}

import React, { Children, forwardRef, useImperativeHandle, useState } from 'react'
import { View, type ViewStyle } from 'react-native'

type PageEvent = { nativeEvent: { position: number } }

type Props = {
  style?: ViewStyle
  initialPage?: number
  scrollEnabled?: boolean
  overdrag?: boolean
  offscreenPageLimit?: number
  onPageSelected?: (e: PageEvent) => void
  children?: React.ReactNode
}

/** Web fallback — native swipe pager is Android/iOS only; tabs still work via tap */
const PagerView = forwardRef<{ setPage: (index: number) => void }, Props>(
  ({ style, initialPage = 0, onPageSelected, children }, ref) => {
    const [page, setPage] = useState(initialPage)
    const pages = Children.toArray(children)

    useImperativeHandle(ref, () => ({
      setPage: (index: number) => {
        setPage(index)
        onPageSelected?.({ nativeEvent: { position: index } })
      },
    }))

    return <View style={[{ flex: 1 }, style]}>{pages[page] ?? null}</View>
  },
)

PagerView.displayName = 'PagerView'

export default PagerView

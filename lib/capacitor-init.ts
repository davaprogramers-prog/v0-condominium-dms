import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

export function useCapacitorInit() {
  useEffect(() => {
    const initializeCapacitor = async () => {
      try {
        // Hide splash screen
        await SplashScreen.hide()

        // Set status bar style
        await StatusBar.setStyle({ style: Style.Dark })
        await StatusBar.setBackgroundColor({ color: '#1f2937' })

        // Handle app back button on Android
        App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            App.exitApp()
          } else {
            window.history.back()
          }
        })
      } catch (error) {
        console.error('[v0] Error initializing Capacitor:', error)
      }
    }

    initializeCapacitor()
  }, [])
}

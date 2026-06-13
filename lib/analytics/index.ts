declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function initGA4(measurementId: string) {
  if (typeof window === 'undefined') return
  if (!measurementId) return
  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })
}

export function trackPageView(url: string, title?: string) {
  if (typeof window === 'undefined' || !window.gtag) return
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  if (!id) return
  window.gtag('config', id, { page_path: url, page_title: title })
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', eventName, params)
}

export function setAnalyticsConsent(granted: boolean) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
  })
  if (granted) {
    localStorage.setItem('analytics_consent', 'granted')
  } else {
    localStorage.setItem('analytics_consent', 'denied')
  }
}

export function hasAnalyticsConsent(): boolean | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('analytics_consent')
  if (!stored) return null
  return stored === 'granted'
}

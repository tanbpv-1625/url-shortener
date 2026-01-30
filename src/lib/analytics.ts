import ReactGA from 'react-ga4'

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID)
  }
}

export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path })
}

export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  })
}

export const trackLinkClick = (shortCode: string, originalUrl: string) => {
  ReactGA.event({
    category: 'Link',
    action: 'Click',
    label: shortCode,
  })

  ReactGA.event({
    category: 'Link',
    action: 'Redirect',
    label: originalUrl,
  })
}

export const trackLinkCreate = (shortCode: string) => {
  ReactGA.event({
    category: 'Link',
    action: 'Create',
    label: shortCode,
  })
}

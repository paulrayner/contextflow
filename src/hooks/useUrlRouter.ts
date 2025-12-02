import { useState, useEffect, useCallback } from 'react'

interface RouteMatch {
  route: 'home' | 'shared-project'
  params: Record<string, string>
}

function parseRoute(pathname: string): RouteMatch {
  // Match /p/:projectId pattern
  const sharedProjectMatch = pathname.match(/^\/p\/([^/]+)\/?$/)
  if (sharedProjectMatch) {
    return {
      route: 'shared-project',
      params: { projectId: sharedProjectMatch[1] },
    }
  }

  // Default to home
  return {
    route: 'home',
    params: {},
  }
}

export function useUrlRouter() {
  const [routeMatch, setRouteMatch] = useState<RouteMatch>(() =>
    parseRoute(window.location.pathname)
  )

  useEffect(() => {
    const handlePopState = () => {
      setRouteMatch(parseRoute(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((path: string) => {
    window.history.pushState(null, '', path)
    setRouteMatch(parseRoute(path))
  }, [])

  return {
    ...routeMatch,
    navigate,
  }
}

export function getSharedProjectUrl(projectId: string): string {
  return `${window.location.origin}/p/${projectId}`
}

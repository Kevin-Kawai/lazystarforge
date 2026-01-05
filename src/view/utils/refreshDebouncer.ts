export function createRefreshDebouncer(refreshFn: () => Promise<void>) {
  let refreshInFlight: Promise<void> | null = null
  let refreshQueued = false

  async function debounce() {
    if (refreshInFlight) {
      refreshQueued = true
      return
    }

    refreshInFlight = (async () => {
      await refreshFn()
    })()

    try {
      await refreshInFlight
    } finally {
      refreshInFlight = null
      if (refreshQueued) {
        refreshQueued = false
        void debounce()
      }
    }
  }

  return debounce
}

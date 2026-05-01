export const clearRecoveryUrlArtifacts = () => {
  const currentHash = window.location.hash.toLowerCase()
  const currentSearch = window.location.search.toLowerCase()

  if (
    currentHash.includes('access_token') ||
    currentHash.includes('type=recovery') ||
    currentSearch.includes('type=recovery')
  ) {
    window.history.replaceState({}, document.title, window.location.pathname)
  }
}

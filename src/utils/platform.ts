export const isTauri = !!(
  typeof window !== 'undefined' && window.__TAURI_INTERNALS__
)

export let isDesktop = false

if (isTauri) {
  const { platform } = await import('@tauri-apps/plugin-os')
  isDesktop = platform() !== 'android' && platform() !== 'ios'
}

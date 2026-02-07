import { ref, onMounted } from 'vue'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const isGoogleLoaded = ref(false)
const isGoogleAvailable = ref(!!GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id-here')
let googleInitPromise = null
let isInitialized = false
let credentialCallback = null

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) {
      resolve()
      return
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
      existing.addEventListener('load', resolve)
      existing.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

async function initGoogle() {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your-google-client-id-here') {
    console.warn('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env')
    isGoogleAvailable.value = false
    return
  }

  if (!googleInitPromise) {
    googleInitPromise = loadGoogleScript().then(() => {
      isGoogleLoaded.value = true
    }).catch((err) => {
      console.error('Failed to load Google Sign-In SDK:', err)
      isGoogleLoaded.value = false
    })
  }

  return googleInitPromise
}

function ensureInitialized() {
  if (!isInitialized && window.google?.accounts) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (credentialCallback) credentialCallback(response)
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true
    })
    isInitialized = true
  }
}

export function useGoogleAuth(onSuccess, onError) {
  const googleLoading = ref(false)

  onMounted(async () => {
    await initGoogle()
    ensureInitialized()
  })

  credentialCallback = async (response) => {
    if (!response.credential) {
      onError?.('No credential received from Google. Please try again.')
      googleLoading.value = false
      return
    }

    googleLoading.value = true
    try {
      await onSuccess(response.credential)
    } catch (err) {
      onError?.(err?.response?.data?.message || 'Google sign-in failed. Please try again.')
    } finally {
      googleLoading.value = false
    }
  }

  const triggerGoogleSignIn = () => {
    if (!isGoogleLoaded.value || !window.google?.accounts) {
      onError?.('Google Sign-In is not available. Please try again later.')
      return
    }

    ensureInitialized()
    googleLoading.value = true

    // Render a hidden Google button and programmatically click it
    const hiddenContainer = document.createElement('div')
    hiddenContainer.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;'
    document.body.appendChild(hiddenContainer)

    window.google.accounts.id.renderButton(hiddenContainer, {
      type: 'standard',
      size: 'large',
      text: 'signin_with'
    })

    // Wait for iframe to render, then click it
    setTimeout(() => {
      const clickTarget = hiddenContainer.querySelector('div[role="button"]')
        || hiddenContainer.querySelector('iframe')
        || hiddenContainer.firstElementChild
      if (clickTarget) {
        clickTarget.click()
      }
      // Cleanup after a delay
      setTimeout(() => {
        if (document.body.contains(hiddenContainer)) {
          document.body.removeChild(hiddenContainer)
        }
        // If still loading after 30s, reset
        setTimeout(() => { googleLoading.value = false }, 30000)
      }, 500)
    }, 300)
  }

  return {
    googleLoading,
    isGoogleAvailable,
    isGoogleLoaded,
    triggerGoogleSignIn
  }
}


import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Responsive utilities composable for handling breakpoints and device detection
 *
 * @example
 * const { isMobile, isTablet, isDesktop, width } = useResponsive()
 *
 * if (isMobile.value) {
 *   // Show mobile menu
 * }
 */
export function useResponsive() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  // Breakpoints
  const MOBILE_BREAKPOINT = 768
  const TABLET_BREAKPOINT = 1024
  const DESKTOP_BREAKPOINT = 1280

  // Computed properties for breakpoints
  const isMobile = ref(width.value < MOBILE_BREAKPOINT)
  const isTablet = ref(width.value >= MOBILE_BREAKPOINT && width.value < DESKTOP_BREAKPOINT)
  const isDesktop = ref(width.value >= DESKTOP_BREAKPOINT)
  const isTabletUp = ref(width.value >= MOBILE_BREAKPOINT)
  const isTouchDevice = ref('ontouchstart' in window || navigator.maxTouchPoints > 0)

  const updateDimensions = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight

    // Update breakpoint refs
    isMobile.value = width.value < MOBILE_BREAKPOINT
    isTablet.value = width.value >= MOBILE_BREAKPOINT && width.value < DESKTOP_BREAKPOINT
    isDesktop.value = width.value >= DESKTOP_BREAKPOINT
    isTabletUp.value = width.value >= MOBILE_BREAKPOINT
  }

  onMounted(() => {
    window.addEventListener('resize', updateDimensions)
    updateDimensions() // Initial check
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateDimensions)
  })

  return {
    // Dimensions
    width,
    height,

    // Breakpoint checks
    isMobile,
    isTablet,
    isDesktop,
    isTabletUp,
    isTouchDevice,

    // Breakpoint values
    breakpoints: {
      mobile: MOBILE_BREAKPOINT,
      tablet: TABLET_BREAKPOINT,
      desktop: DESKTOP_BREAKPOINT,
    },
  }
}

/**
 * Mobile menu state management
 *
 * @example
 * const { isOpen, toggle, open, close } = useMobileMenu()
 */
export function useMobileMenu() {
  const isOpen = ref(false)

  const open = () => {
    isOpen.value = true
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden'
  }

  const close = () => {
    isOpen.value = false
    document.body.style.overflow = ''
  }

  const toggle = () => {
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }

  // Close menu on escape key
  const handleEscape = (event) => {
    if (event.key === 'Escape' && isOpen.value) {
      close()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleEscape)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
    // Ensure body scroll is restored
    document.body.style.overflow = ''
  })

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}

/**
 * Orientation detection
 *
 * @example
 * const { isPortrait, isLandscape } = useOrientation()
 */
export function useOrientation() {
  const isPortrait = ref(window.innerHeight > window.innerWidth)
  const isLandscape = ref(window.innerWidth > window.innerHeight)

  const updateOrientation = () => {
    isPortrait.value = window.innerHeight > window.innerWidth
    isLandscape.value = window.innerWidth > window.innerHeight
  }

  onMounted(() => {
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)
    updateOrientation()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateOrientation)
    window.removeEventListener('orientationchange', updateOrientation)
  })

  return {
    isPortrait,
    isLandscape,
  }
}

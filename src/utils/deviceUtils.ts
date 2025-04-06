/**
 * Utilities for device detection and handling
 */

/**
 * Check if the current device is a mobile device
 * @returns true if the device is mobile, false otherwise
 */
export function isMobileDevice(): boolean {
  // Check for common mobile OS identifiers in user agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Regular expressions for mobile device detection
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Check screen width as additional fallback
  const isMobileScreen = window.innerWidth <= 768;
  
  return mobileRegex.test(userAgent) || isMobileScreen;
}

/**
 * Get device type as a string
 * @returns 'mobile' or 'desktop'
 */
export function getDeviceType(): 'mobile' | 'desktop' {
  return isMobileDevice() ? 'mobile' : 'desktop';
} 
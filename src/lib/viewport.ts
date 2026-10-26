/** True on phone-sized screens (the same breakpoint the CSS uses). */
export function isPhoneViewport(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 640px)').matches
  );
}

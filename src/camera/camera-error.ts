import type { MessageKey } from '../i18n/translate';

export type CameraErrorKind =
  'denied' | 'not_found' | 'busy' | 'unsupported' | 'insecure' | 'other';

/** Why the camera did not open. The text for the person is chosen when it is shown. */
export interface CameraError {
  kind: CameraErrorKind;
}

/** What to tell the person, with what they can do about it: the key of its text. */
export const CAMERA_ERROR_KEYS: Record<CameraErrorKind, MessageKey> = {
  denied: 'cameraError.denied',
  not_found: 'cameraError.notFound',
  busy: 'cameraError.busy',
  unsupported: 'cameraError.unsupported',
  insecure: 'cameraError.insecure',
  other: 'cameraError.other',
};

function kindOf(error: unknown): CameraErrorKind {
  const name = error instanceof Error || error instanceof DOMException ? error.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'denied';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'not_found';
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'busy';
    case 'NotSupportedError':
      return 'unsupported';
    case 'SecurityError':
      return 'insecure';
    default:
      return 'other';
  }
}

/** Turns what the browser throws when the camera does not open into a kind of problem. */
export function describeCameraError(error: unknown): CameraError {
  return { kind: kindOf(error) };
}

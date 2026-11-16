export type CameraErrorKind =
  'denied' | 'not_found' | 'busy' | 'unsupported' | 'insecure' | 'other';

export interface CameraError {
  kind: CameraErrorKind;
  /** What to tell the person, in plain Spanish, with what they can do about it. */
  message: string;
}

const MESSAGES: Record<CameraErrorKind, string> = {
  denied:
    'No tenemos permiso para usar la cámara. Actívalo en los ajustes del navegador para este sitio y vuelve a intentarlo.',
  not_found: 'No encontramos una cámara en este dispositivo.',
  busy: 'La cámara está en uso por otra aplicación. Ciérrala y vuelve a intentarlo.',
  unsupported:
    'Este navegador no puede usar la cámara. Prueba con Chrome, Safari o Firefox actualizados.',
  insecure: 'La cámara solo funciona en una conexión segura (https).',
  other: 'No pudimos abrir la cámara. Vuelve a intentarlo.',
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

/** Turns what the browser throws when the camera does not open into a message for the person. */
export function describeCameraError(error: unknown): CameraError {
  const kind = kindOf(error);
  return { kind, message: MESSAGES[kind] };
}

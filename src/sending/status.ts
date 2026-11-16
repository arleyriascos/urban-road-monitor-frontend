import { describeGpsProblem } from './gps-error';
import { describeAccess, type SendAccess } from './access';
import type { GeolocationState } from '../hooks/useGeolocation';
import type { SendingView } from '../hooks/useDetectionSending';
import { pluralize } from '../lib/format';

export type MessageTone = 'info' | 'warning';

export interface StatusMessage {
  tone: MessageTone;
  text: string;
}

/** The numbers shown under the camera when the person is recording. */
export interface SendingCounts {
  stored: number;
  pending: number;
}

export interface SendingSummary {
  messages: StatusMessage[];
  /** Null when there is nothing to count: a guest, or nothing yet. */
  counts: SendingCounts | null;
}

function senderMessage(view: SendingView): StatusMessage | null {
  switch (view.status) {
    case 'waiting':
      return {
        tone: 'warning',
        text: `No se pudo enviar por ahora. ${pluralize(view.pending, 'bache espera', 'baches esperan')} en tu teléfono y se enviará${view.pending === 1 ? '' : 'n'} solo${view.pending === 1 ? '' : 's'} al volver la conexión.`,
      };
    case 'session_over':
      return {
        tone: 'warning',
        text: `Tu sesión terminó. ${pluralize(view.pending, 'bache queda', 'baches quedan')} guardado${view.pending === 1 ? '' : 's'} en tu teléfono; ingresa de nuevo desde el mapa para enviarlos.`,
      };
    case 'not_allowed':
      return {
        tone: 'warning',
        text: 'Tu cuenta no puede guardar baches ahora. Los que viste quedan en tu teléfono.',
      };
    case 'model_outdated':
      return {
        tone: 'warning',
        text: 'Hay un modelo más nuevo. Recarga la página para actualizarlo; mientras tanto los baches quedan en tu teléfono.',
      };
    default:
      return null;
  }
}

/** What to tell the person about saving, from the account, the GPS and the sender. */
export function summarizeSending(
  access: SendAccess,
  gps: GeolocationState,
  view: SendingView,
  cameraOn: boolean,
): SendingSummary {
  const messages: StatusMessage[] = [{ tone: 'info', text: describeAccess(access) }];
  if (access.status !== 'allowed') return { messages, counts: null };

  if (cameraOn && gps.status === 'problem') {
    messages.push({ tone: 'warning', text: describeGpsProblem(gps.problem) });
  } else if (cameraOn && gps.status === 'waiting') {
    messages.push({ tone: 'info', text: 'Buscando la ubicación del teléfono…' });
  }

  const problem = senderMessage(view);
  if (problem) messages.push(problem);
  else if (!cameraOn && view.pending > 0) {
    messages.push({
      tone: 'info',
      text: `${pluralize(view.pending, 'bache pendiente', 'baches pendientes')} de enviar.`,
    });
  }

  const hasCounts = view.stored > 0 || view.pending > 0;
  return { messages, counts: hasCounts ? { stored: view.stored, pending: view.pending } : null };
}

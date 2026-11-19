import { describeGpsProblem } from './gps-error';
import { describeAccess, type SendAccess } from './access';
import type { GeolocationState } from '../hooks/useGeolocation';
import type { SendingView } from '../hooks/useDetectionSending';
import { formatNumber } from '../lib/format';
import { defaultTexts, type Texts } from '../lib/translator';

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

function senderMessage(view: SendingView, { t, locale }: Texts): StatusMessage | null {
  const count = formatNumber(view.pending, locale);
  const one = view.pending === 1;
  switch (view.status) {
    case 'waiting':
      return {
        tone: 'warning',
        text: t(one ? 'sending.waitingMessage.one' : 'sending.waitingMessage.other', { count }),
      };
    case 'session_over':
      return {
        tone: 'warning',
        text: t(one ? 'sending.sessionOver.one' : 'sending.sessionOver.other', { count }),
      };
    case 'not_allowed':
      return { tone: 'warning', text: t('sending.notAllowed') };
    case 'model_outdated':
      return { tone: 'warning', text: t('sending.modelOutdated') };
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
  texts: Texts = defaultTexts,
): SendingSummary {
  const { t, locale } = texts;
  const messages: StatusMessage[] = [{ tone: 'info', text: describeAccess(access, t) }];
  if (access.status !== 'allowed') return { messages, counts: null };

  if (cameraOn && gps.status === 'problem') {
    messages.push({ tone: 'warning', text: describeGpsProblem(gps.problem, t) });
  } else if (cameraOn && gps.status === 'waiting') {
    messages.push({ tone: 'info', text: t('sending.locating') });
  }

  const problem = senderMessage(view, texts);
  if (problem) messages.push(problem);
  else if (!cameraOn && view.pending > 0) {
    messages.push({
      tone: 'info',
      text: t(view.pending === 1 ? 'sending.pending.one' : 'sending.pending.other', {
        count: formatNumber(view.pending, locale),
      }),
    });
  }

  const hasCounts = view.stored > 0 || view.pending > 0;
  return { messages, counts: hasCounts ? { stored: view.stored, pending: view.pending } : null };
}

import { useLanguage } from '../i18n/useLanguage';
import { formatNumber } from '../lib/format';
import type { SendingSummary } from '../sending/status';

/** What happens to the potholes the camera sees: saved or not, how many were sent, how many wait. */
export function SendingStatus({ summary }: { summary: SendingSummary }) {
  const { t, locale } = useLanguage();
  return (
    <section className="sending" aria-label={t('sending.label')}>
      {summary.messages.map((message) => (
        <p
          key={message.text}
          className={`sending__message${message.tone === 'warning' ? ' sending__message--warning' : ''}`}
          role="status"
        >
          {message.text}
        </p>
      ))}
      {summary.counts && (
        <dl className="sending__counts">
          <div className="sending__count">
            <dt>{t('sending.sent')}</dt>
            <dd>{formatNumber(summary.counts.stored, locale)}</dd>
          </div>
          <div className="sending__count">
            <dt>{t('sending.waiting')}</dt>
            <dd>{formatNumber(summary.counts.pending, locale)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

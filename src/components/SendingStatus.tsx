import type { SendingSummary } from '../sending/status';

/** What happens to the potholes the camera sees: saved or not, how many were sent, how many wait. */
export function SendingStatus({ summary }: { summary: SendingSummary }) {
  return (
    <section className="sending" aria-label="Guardado de baches">
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
            <dt>Enviados</dt>
            <dd>{summary.counts.stored}</dd>
          </div>
          <div className="sending__count">
            <dt>En espera</dt>
            <dd>{summary.counts.pending}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

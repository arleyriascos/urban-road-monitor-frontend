import type { ReactNode } from 'react';
import { Brand } from './BrandMark';

/** The frame of the pages that open from a link in an email: the logo and a card, with no session. */
export function EmailLinkShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="splash">
      <section className="panel splash__card">
        <div className="splash__brand">
          <Brand href="/" />
        </div>
        <h1 className="account-page__title">{title}</h1>
        {children}
      </section>
    </main>
  );
}

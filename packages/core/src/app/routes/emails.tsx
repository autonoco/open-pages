import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, useLocale } from '~/lib/use-locale';
import { SystemViewIcon } from '../components/sidebar/folder-item';
import { emailCreatedAt, emailIds, emailMeta } from '../lib/emails';
import { PageThumb } from '../lib/page-thumb';

// Emails lay out at 600px; a slightly wider thumb viewport keeps the body
// margins visible so the card reads as an email, not a cropped page.
const EMAIL_THUMB_VIEWPORT = 760;

export function EmailsGalleryPage() {
  const t = useLocale();
  const sorted = emailIds
    .slice()
    .sort((a, b) => (emailCreatedAt[b] ?? 0) - (emailCreatedAt[a] ?? 0));

  return (
    <>
      <header className="mb-6 md:mb-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <SystemViewIcon kind="emails" className="text-muted-foreground" />
          <h1 className="font-heading text-[19px] font-semibold leading-none tracking-[-0.015em] md:text-[21px]">
            {t.emails.title}
          </h1>
          <span className="folio ml-0.5">{emailIds.length.toString().padStart(2, '0')}</span>
        </div>
      </header>

      {sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-6 gap-y-9 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {sorted.map((id, i) => {
            const info = emailMeta[id];
            const title = info?.title ?? id;
            return (
              <li
                key={id}
                className="rise-in"
                style={{ animationDelay: `${Math.min(i, 11) * 30}ms` }}
              >
                <Link
                  to={`/e/${id}`}
                  aria-label={format(t.emails.openEmailAria, { name: title })}
                  className="group block rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[6px] border border-hairline bg-card shadow-edge ring-1 ring-foreground/[0.04] group-hover:shadow-floating group-hover:ring-foreground/20 motion-safe:transition-[box-shadow,--tw-ring-color,scale] motion-safe:duration-200 group-active:scale-[0.99]">
                    <div className="h-full w-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]">
                      <PageThumb
                        source={{ emailId: id }}
                        title={title}
                        viewport={EMAIL_THUMB_VIEWPORT}
                      />
                    </div>
                  </div>
                  <div className="mt-3 min-w-0">
                    <h3 className="truncate font-heading text-[14px] font-medium tracking-tight">
                      {title}
                    </h3>
                    <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                      {info?.subject ?? t.emails.noSubject}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function EmptyState() {
  const t = useLocale();
  return (
    <div className="rounded-[8px] border border-dashed border-border px-8 py-20">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <Mail className="size-5 text-muted-foreground/60" aria-hidden />
        <p className="mt-4 font-heading text-[14px] font-semibold tracking-tight">
          {t.emails.noEmailsTitle}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {t.emails.noEmailsHintPrefix}
          <code className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">
            /create-email
          </code>
          {t.emails.noEmailsHintSuffix}
        </p>
      </div>
    </div>
  );
}

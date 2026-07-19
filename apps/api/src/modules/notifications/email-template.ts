const BRAND = {
  ink: '#20264a',
  cream: '#f4eedd',
  nawillBlue: '#4757b8',
  gold: '#7a7256',
  textMuted: '#6b7280',
};

const COMPANY = {
  name: 'Nawill Technology Ltd.',
  address: '4, Akinshola Street, Yaba, Lagos, Nigeria',
  website: 'nawill.ng',
};

export interface EmailTemplateInput {
  heading: string;
  /** Each entry is rendered as its own paragraph. */
  bodyLines: string[];
  cta?: { label: string; url: string };
  /** A large, letter-spaced code display — for OTP-style emails instead of a link. */
  code?: string;
  footerNote?: string;
}

/**
 * One shared visual shape for every transactional email (password reset, email
 * verification, 2FA codes, ...) instead of ad-hoc plain-text strings per call site.
 * Deliberately web-safe system fonts, not the brand's custom faces (IBM Plex/Special
 * Elite) — email client font support is unreliable enough that embedding custom
 * fonts risks broken rendering; brand identity here comes through color instead
 * (Ink navy header, Cream/Paper tints) — see docs/ARCHITECTURE.md §8.8.
 */
export function renderEmailTemplate(input: EmailTemplateInput): { html: string; text: string } {
  const paragraphs = input.bodyLines.map((line) => `<p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.6;">${line}</p>`).join('\n');

  const ctaHtml = input.cta
    ? `
    <div style="text-align:center;margin:28px 0;">
      <a href="${input.cta.url}" style="display:inline-block;background:${BRAND.ink};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:6px;">${input.cta.label}</a>
    </div>
    <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:12.5px;line-height:1.6;word-break:break-all;">
      Or copy this link into your browser:<br>
      <a href="${input.cta.url}" style="color:${BRAND.nawillBlue};">${input.cta.url}</a>
    </p>`
    : '';

  const codeHtml = input.code
    ? `
    <div style="text-align:center;margin:28px 0;">
      <span style="display:inline-block;background:${BRAND.cream};color:${BRAND.ink};font-size:28px;font-weight:700;letter-spacing:6px;padding:14px 24px;border-radius:6px;">${input.code}</span>
    </div>`
    : '';

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f4f4f4;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border-collapse:collapse;">
      <tr>
        <td style="background:${BRAND.ink};padding:24px 32px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:2px;">NAWILL</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <h1 style="margin:0 0 16px;color:${BRAND.ink};font-size:20px;font-weight:700;">${input.heading}</h1>
          ${paragraphs}
          ${ctaHtml}
          ${codeHtml}
          ${input.footerNote ? `<p style="margin:24px 0 0;color:${BRAND.textMuted};font-size:12.5px;line-height:1.6;">${input.footerNote}</p>` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #eef0f3;">
          <p style="margin:0;color:${BRAND.textMuted};font-size:11.5px;line-height:1.6;">
            ${COMPANY.name} &middot; ${COMPANY.address}<br>
            ${COMPANY.website}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textLines = [
    input.heading,
    '',
    ...input.bodyLines.map(stripHtml),
    ...(input.cta ? ['', `${input.cta.label}: ${input.cta.url}`] : []),
    ...(input.code ? ['', `Code: ${input.code}`] : []),
    ...(input.footerNote ? ['', stripHtml(input.footerNote)] : []),
    '',
    `— ${COMPANY.name}`,
  ];

  return { html, text: textLines.join('\n') };
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, '');
}

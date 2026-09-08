// Matches nawill.ng's own floating WhatsApp button exactly (same number, same
// positioning) — see assets/css/style.css `.whatsapp-float` on the marketing site.
const WHATSAPP_NUMBER = '2349018515257';
const DEFAULT_MESSAGE = "Hi Nawill, I need help with my account.";

export function WhatsAppFloat() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-whatsapp/40 transition-transform hover:scale-110 hover:shadow-xl"
    >
      <svg viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7" aria-hidden="true">
        <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.31.65 4.47 1.78 6.31L4 29l7.9-1.74A11.94 11.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.628 3 16.001 3Zm0 21.818a9.78 9.78 0 0 1-4.99-1.365l-.358-.213-4.686 1.032 1.06-4.564-.234-.372A9.79 9.79 0 0 1 5.182 15c0-5.966 4.853-10.818 10.819-10.818S26.818 9.034 26.818 15 21.966 24.818 16.001 24.818Zm5.61-7.98c-.307-.154-1.816-.897-2.098-.999-.281-.103-.486-.154-.69.153-.205.308-.792.999-.972 1.204-.179.205-.358.23-.665.077-.307-.154-1.296-.478-2.469-1.523-.913-.814-1.529-1.82-1.708-2.127-.179-.308-.019-.474.135-.627.138-.138.307-.358.46-.538.154-.179.205-.307.307-.512.103-.205.051-.384-.026-.538-.077-.154-.69-1.662-.945-2.277-.249-.598-.502-.517-.69-.526l-.588-.01a1.13 1.13 0 0 0-.818.384c-.281.308-1.074 1.05-1.074 2.56s1.1 2.97 1.253 3.175c.154.205 2.166 3.307 5.248 4.638.733.316 1.305.505 1.751.646.735.234 1.404.201 1.933.122.59-.088 1.816-.742 2.072-1.459.256-.717.256-1.332.179-1.46-.077-.128-.281-.205-.588-.359Z" />
      </svg>
    </a>
  );
}

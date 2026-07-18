import { ApiError } from './types';

/**
 * Every Server Action in lib/actions/ returns this shape, so every form in the app
 * handles success/error/field-errors identically via useFormState — one pattern,
 * not one bespoke error-handling scheme per form.
 */
export interface ActionResult {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  /** Set by actions that hand the UI something to render (a payment link, a TOTP QR code, ...). */
  data?: Record<string, unknown>;
}

export function actionErrorFrom(e: unknown): ActionResult {
  if (e instanceof ApiError) {
    const fieldErrors: Record<string, string> = {};
    for (const fe of e.errors ?? []) {
      if (fe.field) fieldErrors[fe.field] = fe.message;
    }
    return { error: e.message, fieldErrors };
  }
  return { error: 'Something went wrong — is the API reachable?' };
}

/** Map a Firebase auth error to a user-facing i18n key (falls back to the generic one). */
export function authErrorKey(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  switch (code) {
    case "auth/email-already-in-use":
      return "auth.errEmailExists";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "auth.errInvalidCredentials";
    case "auth/weak-password":
      return "auth.errWeakPassword";
    case "auth/too-many-requests":
      return "auth.errTooManyRequests";
    default:
      return "auth.errGeneric";
  }
}

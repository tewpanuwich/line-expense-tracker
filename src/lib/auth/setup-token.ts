export function isTokenExpired(expiresAt: string | null): boolean {
  return !expiresAt || new Date(expiresAt).getTime() < Date.now();
}

export function isSetupTokenValid(
  member: { has_setup: boolean; setup_token_expires_at: string | null } | null
): member is { has_setup: false; setup_token_expires_at: string } {
  return !!member && !member.has_setup && !isTokenExpired(member.setup_token_expires_at);
}

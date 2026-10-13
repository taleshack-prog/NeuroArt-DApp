/** Mensagem de login do admin — sem dependências de servidor, usada também no navegador */
export const SESSION_HOURS = 12
export const LOGIN_TITLE = 'NeuroArt Admin — entrar'
export const LOGIN_FOOTER = 'Esta assinatura só confirma que você controla a carteira. Não envia transação nem custa gás.'

export function buildLoginMessage(address: string, host: string, issuedAt: Date, expiresAt: Date) {
  return [
    LOGIN_TITLE,
    `Endereço: ${address}`,
    `Site: ${host}`,
    `Emitido em: ${issuedAt.toISOString()}`,
    `Válido até: ${expiresAt.toISOString()}`,
    '',
    LOGIN_FOOTER,
  ].join('\n')
}

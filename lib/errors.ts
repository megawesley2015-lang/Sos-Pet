// lib/errors.ts — fonte única da verdade para todos os erros do SOS Pet Aumigo

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const Errors = {
  // Autenticação
  NOT_AUTHENTICATED:    new AppError('Você precisa estar logado para continuar', 'NOT_AUTHENTICATED', 401),
  SESSION_EXPIRED:      new AppError('Sessão expirada — faça login novamente', 'SESSION_EXPIRED', 401),
  FORBIDDEN:            new AppError('Você não tem permissão para esta ação', 'FORBIDDEN', 403),

  // Pets
  PET_NOT_FOUND:        new AppError('Pet não encontrado', 'PET_NOT_FOUND', 404),
  PET_ALREADY_RESOLVED: new AppError('Este alerta já foi resolvido', 'PET_ALREADY_RESOLVED', 409),

  // Validação
  INVALID_PAYLOAD:      new AppError('Dados inválidos — verifique os campos', 'INVALID_PAYLOAD', 422),
  MISSING_FIELDS:       new AppError('Campos obrigatórios não preenchidos', 'MISSING_FIELDS', 422),

  // Storage
  UPLOAD_FAILED:        new AppError('Falha no upload da foto', 'UPLOAD_FAILED', 500),
  FILE_TOO_LARGE:       new AppError('Arquivo muito grande — máximo 5MB', 'FILE_TOO_LARGE', 413),
  INVALID_FILE_TYPE:    new AppError('Tipo inválido — use JPG, PNG ou WebP', 'INVALID_FILE_TYPE', 415),

  // Genérico
  INTERNAL:             new AppError('Erro interno — tente novamente', 'INTERNAL_ERROR', 500),
  NOT_FOUND:            new AppError('Recurso não encontrado', 'NOT_FOUND', 404),
  RATE_LIMITED:         new AppError('Muitas requisições — aguarde um momento', 'RATE_LIMITED', 429),
} as const

// Mapa: código Postgres → AppError
const POSTGRES_MAP: Record<string, AppError> = {
  '23505': new AppError('Registro duplicado', 'DUPLICATE_RECORD', 409),
  '23503': new AppError('Referência inválida — tente novamente', 'FK_VIOLATION', 400),
  '42501': new AppError('Sem permissão', 'FORBIDDEN', 403),
  '23502': new AppError('Campo obrigatório não preenchido', 'NOT_NULL_VIOLATION', 422),
  '22P02': new AppError('Formato de dado inválido', 'INVALID_FORMAT', 422),
}

// Mapa: código PostgREST → AppError
const POSTGREST_MAP: Record<string, AppError> = {
  'PGRST116': new AppError('Nenhum resultado encontrado', 'NOT_FOUND', 404),
  'PGRST301': Errors.SESSION_EXPIRED,
}

export function resolveError(err: unknown): AppError {
  if (err instanceof AppError) return err

  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: string }).code)
    if (POSTGRES_MAP[code])  return POSTGRES_MAP[code]
    if (POSTGREST_MAP[code]) return POSTGREST_MAP[code]
    if ('status' in err && (err as { status: number }).status === 401) {
      return Errors.SESSION_EXPIRED
    }
  }

  if (err instanceof Error) {
    if (err.message.includes('Invalid Refresh Token')) return Errors.SESSION_EXPIRED
    if (err.message.includes('JWT expired'))           return Errors.SESSION_EXPIRED
    if (err.message.includes('Payload too large'))     return Errors.FILE_TOO_LARGE
  }

  return Errors.INTERNAL
}

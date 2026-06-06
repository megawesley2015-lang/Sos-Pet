// types/errors.ts — contratos de resposta usados em todas as camadas

export interface ApiError {
  success: false
  error:   string    // mensagem PT-BR para o usuário
  code:    string    // identificador para log e roteamento n8n
  details?: unknown  // apenas em NODE_ENV=development
}

export interface ApiSuccess<T = unknown> {
  success: true
  data:    T
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

export function isApiError(res: ApiResponse): res is ApiError {
  return res.success === false
}

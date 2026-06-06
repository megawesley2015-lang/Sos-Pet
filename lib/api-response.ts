// lib/api-response.ts — helpers de resposta para todas as API Routes

import { NextResponse }          from 'next/server'
import { resolveError, AppError } from '@/lib/errors'
import type { ApiResponse }      from '@/types/errors'

const IS_DEV = process.env.NODE_ENV === 'development'

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

export function fail(err: unknown): NextResponse<ApiResponse> {
  const appErr = resolveError(err)

  const body: ApiResponse = {
    success: false,
    error:   appErr.message,
    code:    appErr.code,
    ...(IS_DEV && err instanceof Error
      ? { details: { originalMessage: err.message, stack: err.stack } }
      : {}
    ),
  }

  if (appErr.status >= 500) {
    console.error(`[${appErr.code}]`, err)
  }

  return NextResponse.json(body, { status: appErr.status })
}

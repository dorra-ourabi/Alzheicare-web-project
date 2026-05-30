import { API_BASE_URL, ApiError } from './api'

type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

export async function graphqlRequest<T>(query: string, variables: Record<string, unknown> = {}, token?: string) {
  const response = await fetch(`${API_BASE_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  })

  const payload = (await response.json()) as GraphQLResponse<T>

  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.[0]?.message || response.statusText || 'GraphQL request failed'
    throw new ApiError(message, response.status, payload)
  }

  if (!payload.data) {
    throw new ApiError('GraphQL response missing data', response.status, payload)
  }

  return payload.data
}
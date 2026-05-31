import { ApiError, apiRequestWithAuth } from './api'

type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

export async function graphqlRequest<T>(query: string, variables: Record<string, unknown> = {}, token?: string) {
  const payload = await apiRequestWithAuth<GraphQLResponse<T>>(
    '/graphql',
    {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
    },
    token,
  )

  if (payload.errors?.length) {
    const message = payload.errors?.[0]?.message || 'GraphQL request failed'
    throw new ApiError(message, 400, payload)
  }

  if (!payload.data) {
    throw new ApiError('GraphQL response missing data', 400, payload)
  }

  return payload.data
}
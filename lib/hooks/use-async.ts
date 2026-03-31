import { useEffect, useState } from "react"

interface UseAsyncState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true,
  dependencies: any[] = []
): UseAsyncState<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const execute = async () => {
    setState({ data: null, isLoading: true, error: null })
    try {
      const response = await asyncFunction()
      setState({ data: response, isLoading: false, error: null })
      return response
    } catch (error) {
      setState({ data: null, isLoading: false, error: error as Error })
      throw error
    }
  }

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, dependencies)

  return state
}

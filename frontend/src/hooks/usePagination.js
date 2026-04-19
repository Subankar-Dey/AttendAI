import { useState, useCallback } from 'react'

export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const setPaginationData = useCallback(({ total: totalCount, page: currentPage, limit: pageLimit }) => {
    setTotal(totalCount)
    setPage(currentPage)
    setLimit(pageLimit)
    setTotalPages(Math.ceil(totalCount / pageLimit))
  }, [])

  const nextPage = useCallback(() => {
    setPage(prev => Math.min(prev + 1, totalPages))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(prev - 1, 1))
  }, [])

  const goToPage = useCallback((pageNumber) => {
    const validPage = Math.max(1, Math.min(pageNumber, totalPages))
    setPage(validPage)
  }, [totalPages])

  const resetPagination = useCallback(() => {
    setPage(1)
    setTotal(0)
    setTotalPages(0)
  }, [])

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    setPaginationData,
    nextPage,
    prevPage,
    goToPage,
    resetPagination,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

export default usePagination

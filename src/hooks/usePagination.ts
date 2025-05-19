import { useState, useMemo } from 'react';

interface PaginationOptions {
  totalItems: number;
  initialPage?: number;
  itemsPerPage?: number;
}

interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  currentItems: T[];
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setItemsPerPage: (count: number) => void;
  paginateItems: (items: T[]) => T[];
}

export function usePagination<T>({
  totalItems,
  initialPage = 1,
  itemsPerPage = 10,
}: PaginationOptions): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage);

  const totalPages = Math.ceil(totalItems / itemsPerPageState);

  // Ensure current page is within bounds when total pages changes
  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const setPage = (page: number) => {
    const newPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(newPage);
  };

  const nextPage = () => {
    setPage(currentPage + 1);
  };

  const previousPage = () => {
    setPage(currentPage - 1);
  };

  const setItemsPerPage = (count: number) => {
    setItemsPerPageState(count);
    // Reset to first page when changing items per page
    setCurrentPage(1);
  };

  const paginateItems = (items: T[]): T[] => {
    const startIndex = (currentPage - 1) * itemsPerPageState;
    const endIndex = startIndex + itemsPerPageState;
    return items.slice(startIndex, endIndex);
  };

  return {
    currentPage,
    totalPages,
    itemsPerPage: itemsPerPageState,
    currentItems: [] as T[], // This will be populated by the component using the hook
    setPage,
    nextPage,
    previousPage,
    setItemsPerPage,
    paginateItems,
  };
} 
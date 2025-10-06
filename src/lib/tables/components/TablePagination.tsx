import React from 'react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { computed, type Signal } from '@preact/signals-react';
import type { TableState, TableActions } from '../types';

interface TablePaginationProps<T = any> {
  className?: string;
  state: Signal<TableState<T>>;
  actions: TableActions<T>;
}

const TablePagination = <T extends Record<string, any>>({ className, state, actions }: TablePaginationProps<T>) => {
  const currentPage = computed(() => state.value.data.page);
  const totalCount = computed(() => state.value.data.totalCount);
  const pageSize = computed(() => state.value.data.pageSize);
  const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

  const handlePrevious = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentPage.value > 1) {
      actions.prevPage();
      await actions.loadData();
    }
  };

  const handleNext = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentPage.value < totalPages.value) {
      actions.nextPage();
      await actions.loadData();
    }
  };

  const handlePageClick = async (e: React.MouseEvent, page: number) => {
    e.preventDefault();
    actions.setPage(page);
    await actions.loadData();
  };

  const getVisiblePages = (): (number | 'ellipsis')[] => {
    const total = totalPages.value;
    const current = currentPage.value;
    const pages: (number | 'ellipsis')[] = [];

    if (total <= 7) {
      // Показываем все страницы если их меньше 7
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Всегда показываем первую страницу
      pages.push(1);

      if (current > 3) {
        pages.push('ellipsis');
      }

      // Показываем страницы вокруг текущей
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('ellipsis');
      }

      // Всегда показываем последнюю страницу
      pages.push(total);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  const isPrevDisabled = currentPage.value === 1;
  const isNextDisabled = currentPage.value === totalPages.value || totalPages.value === 0;

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={handlePrevious}
            aria-disabled={isPrevDisabled}
            style={isPrevDisabled ? { pointerEvents: 'none', opacity: 0.5 } : undefined}
          />
        </PaginationItem>

        {visiblePages.map((page, index) => (
          <PaginationItem key={index}>
            {page === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                onClick={(e) => handlePageClick(e, page)}
                isActive={page === currentPage.value}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={handleNext}
            aria-disabled={isNextDisabled}
            style={isNextDisabled ? { pointerEvents: 'none', opacity: 0.5 } : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default TablePagination;

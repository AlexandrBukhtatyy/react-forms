import React from 'react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { type UsersTableStore } from '../../../domains/users/table/signals/tableSignals';
import { changePage } from '../../../domains/users/table/logic/tableLogic';
import { computed, type Signal } from '@preact/signals-react';

interface TablePaginationProps {
  className?: string;
  state: Signal<UsersTableStore>;
  setting?: any;
}

const TablePagination: React.FC<TablePaginationProps> = ({ className, state }) => {
  const currentPage = computed(() => state.value.data.currentPage);
  const totalPages = computed(() => state.value.data.totalPages);

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentPage.value > 1) {
      changePage(currentPage.value - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentPage.value < totalPages.value) {
      changePage(currentPage.value + 1);
    }
  };

  const handlePageClick = (e: React.MouseEvent, page: number) => {
    e.preventDefault();
    changePage(page);
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
  const isNextDisabled = currentPage.value === totalPages.value;

  return (
    <Pagination>
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
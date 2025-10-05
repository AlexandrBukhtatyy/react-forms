import { useEffect } from "react";
import FilterForm from "../domains/users/table/components/FilterForm";
import Table from "../domains/users/table/components/Table";
import TableToolbar from "../domains/users/table/components/TableToolbar";
import { loadUsers } from "../domains/users/table/logic/tableLogic";
import TablePagination from "../domains/users/table/components/TablePagination";

function TablePage() {
  console.debug('[TablePage]: 1')
  useEffect(() => {
    console.debug('[TablePage]: 2')
    loadUsers();
  }, []);

  return (
    <>
      <div className="container mx-auto px-4 pt-6 pb-6 max-w-6xl">
        <FilterForm className="mb-6"/>
        <TableToolbar className="mb-6"/>
        <Table className="mb-6"/>
        <TablePagination/>
      </div>
    </>
  );
}

export default TablePage;

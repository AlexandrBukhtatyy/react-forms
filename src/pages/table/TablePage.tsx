import { useEffect } from "react";
import FilterForm from "./components/FilterForm";
import Table from "./components/Table";
import TableToolbar from "./components/TableToolbar";
import { loadUsers } from "./logic/tableLogic";
import TablePagination from "./components/TablePagination";

function TablePage() {

  useEffect(() => {
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

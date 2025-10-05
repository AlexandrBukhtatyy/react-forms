import React, { useEffect } from 'react';
import UsersFilterForm from "./UsersFilterForm";
import Table from "../../../../lib/tables/Table";
import TableToolbar from "../../../../lib/tables/TableToolbar";
import TablePagination from "../../../../lib/tables/TablePagination";
import { loadUsers } from '../logic/tableLogic';
import { tableStore } from '../signals/tableSignals';


interface UsersTableProps {
  className?: string;
}


const UsersTable: React.FC<UsersTableProps> = ({ className }) => {
  useEffect(() => {
    loadUsers();
  }, []);

  return (
  <>
    <UsersFilterForm className="mb-6"/>
    <TableToolbar className="mb-6"/>
    <Table className="mb-6" state={tableStore} setting={{}}/>
    <TablePagination state={tableStore}/>
  </>
  );
};

export default UsersTable;

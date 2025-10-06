import React from "react";
import { type UsersTableStore } from "../../../domains/users/table/signals/tableSignals";
import {
	Table as TableComponent,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { computed, type Signal } from "@preact/signals-react";

export interface ColumnConfig<T = any> {
	key: string;
	header: string;
	value: (item: T) => React.ReactNode;
	skeletonWidth?: string;
}

interface TableProps<T = any> {
	className?: string;
	state: Signal<UsersTableStore>;
	columns: ColumnConfig<T>[];
}

const Table: React.FC<TableProps> = ({ className, state, columns }) => {
	const currentUsers = computed(() => state.value.data.users);
	const isLoading = computed(() => state.value.ui.isLoading);
	const error = computed(() => state.value.ui.error);
	const pageSize = computed(() => state.value.data.pageSize);

	return (
		<div className={cn("w-full border-collapse overflow-hidden rounded-md", className)}>
			<TableComponent>
				<TableHeader>
					<TableRow>
						{columns.map((column) => (
							<TableHead key={column.key}>{column.header}</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
		     {isLoading.value && !error.value && (
		       Array.from({ length: pageSize.value }).map((_, index) => (
		         <TableRow key={index}>
							 {columns.map((column) => (
								 <TableCell key={column.key}>
									 <div className={cn("h-4 bg-gray-200 rounded animate-pulse", column.skeletonWidth || "w-20")} />
								 </TableCell>
							 ))}
		         </TableRow>
		       ))
		     )}
         {!isLoading.value && currentUsers.value?.length && !error.value && (
		       currentUsers.value.map(user => (
            <TableRow key={user.id}>
							{columns.map((column) => (
								<TableCell key={column.key}>{column.value(user)}</TableCell>
							))}
					  </TableRow>
		       ))
		     )}
        {!isLoading.value && !currentUsers.value?.length && !error.value && (
          <TableRow>
						<TableCell colSpan={columns.length} className="h-24 text-center">
							Нет данных.
						</TableCell>
					</TableRow>
		     )}
        {!isLoading.value && !currentUsers.value?.length && error.value && (
          <TableRow>
						<TableCell colSpan={columns.length} className="h-24 text-center text-red-500">
							Ошибка: {error.value}
						</TableCell>
					</TableRow>
		     )}
				</TableBody>
			</TableComponent>
		</div>
	);
};

export default Table;

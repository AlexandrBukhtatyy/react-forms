import React from "react";
import {
	Table as TableComponent,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/lib/ui/table";
import { cn } from "@/lib/utils";
import { computed } from "@preact/signals-react";
import type { TableStore } from "../store/TableStore";

interface TableProps<T extends Record<string, any> = any> {
	className?: string;
	control: TableStore<T>;
}

const Table = <T extends Record<string, any>>({ className, control }: TableProps<T>) => {
	const items = computed(() => control.signal.value.data.items);
	const isLoading = computed(() => control.signal.value.ui.isLoading);
	const error = computed(() => control.signal.value.ui.error);
	const columns = computed(() => control.signal.value.config.columns);
	const messages = computed(() => control.signal.value.config.messages);
	const skeletonRows = computed(() => control.signal.value.config.skeleton.rows);

	return (
		<div className={cn("w-full border-collapse overflow-hidden rounded-md", className)}>
			<TableComponent>
				<TableHeader>
					<TableRow>
						{columns.value.map((column) => (
							<TableHead key={column.key} className={column.headerClassName}>
								{column.header}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{/* Загрузка - скелетоны */}
					{isLoading.value && !error.value && (
						Array.from({ length: skeletonRows.value }).map((_, index) => (
							<TableRow key={index}>
								{columns.value.map((column) => (
									<TableCell key={column.key}>
										<div className={cn("h-4 bg-gray-200 rounded animate-pulse", column.skeleton?.width || "w-20")} />
									</TableCell>
								))}
							</TableRow>
						))
					)}

					{/* Данные загружены */}
					{!isLoading.value && items.value?.length > 0 && !error.value && (
						items.value.map((item, index) => (
							<TableRow key={item.id || index}>
								{columns.value.map((column) => (
									<TableCell
										key={column.key}
										className={column.cellClassName ? column.cellClassName(item) : column.className}
									>
										{column.value(item)}
									</TableCell>
								))}
							</TableRow>
						))
					)}

					{/* Пустое состояние */}
					{!isLoading.value && (!items.value || items.value.length === 0) && !error.value && (
						<TableRow>
							<TableCell colSpan={columns.value.length} className="h-24 text-center">
								{messages.value.empty}
							</TableCell>
						</TableRow>
					)}

					{/* Ошибка */}
					{!isLoading.value && error.value && (
						<TableRow>
							<TableCell colSpan={columns.value.length} className="h-24 text-center text-red-500">
								{messages.value.error(error.value)}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</TableComponent>
		</div>
	);
};

export default Table;

"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight, ChevronDown } from "lucide-react"

interface TreeDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: string
  filterPlaceholder?: string
  getSubRows: (row: TData) => TData[] | undefined
}

export function TreeDataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  filterPlaceholder = "Filtrar...",
  getSubRows,
}: TreeDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = React.useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows,
  })

  return (
    <div>
      {filterColumn && (
        <div className="flex items-center py-4">
          <Input
            placeholder={filterPlaceholder}
            value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(filterColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.toggleAllRowsExpanded(!table.getIsAllRowsExpanded())}
            className="ml-4"
          >
            {table.getIsAllRowsExpanded() ? "Recolher Tudo" : "Expandir Tudo"}
          </Button>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} registros
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  )
}

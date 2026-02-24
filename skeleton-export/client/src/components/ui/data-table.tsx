"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: string
  filterPlaceholder?: string
  searchKey?: string
  searchPlaceholder?: string
  enableRowSelection?: boolean
  onSelectionChange?: (selectedRows: TData[]) => void
  className?: string
  filterContainerClassName?: string
  filterInputClassName?: string
  tableContainerClassName?: string
  tableHeaderClassName?: string
  tableHeaderRowClassName?: string
  tableHeadClassName?: string
  tableRowClassName?: string
  tableCellClassName?: string
  emptyCellClassName?: string
  paginationVariant?: "text" | "icons"
  paginationContainerClassName?: string
  paginationInfoClassName?: string
  paginationButtonsClassName?: string
  paginationButtonClassName?: string
  paginationCurrentPageClassName?: string
  enableGlobalFilter?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  filterPlaceholder,
  searchKey,
  searchPlaceholder,
  enableRowSelection = false,
  onSelectionChange,
  className,
  filterContainerClassName,
  filterInputClassName,
  tableContainerClassName,
  tableHeaderClassName,
  tableHeaderRowClassName,
  tableHeadClassName,
  tableRowClassName,
  tableCellClassName,
  emptyCellClassName,
  paginationVariant = "text",
  paginationContainerClassName,
  paginationInfoClassName,
  paginationButtonsClassName,
  paginationButtonClassName,
  paginationCurrentPageClassName,
  enableGlobalFilter = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  // Determine which column to use for filtering (support both prop names)
  const activeFilterColumn = filterColumn || searchKey;
  const activePlaceholder = filterPlaceholder || searchPlaceholder || "Filtrar...";

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    enableRowSelection: enableRowSelection,
  })

  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, table]);

  const pageIndex = table.getState().pagination.pageIndex
  const pageCount = table.getPageCount()

  return (
    <div className={className}>
      <div className={cn("flex items-center py-4 px-1 gap-2", filterContainerClassName)}>
        {enableGlobalFilter && (
          <Input
            placeholder="BUSCAR EM TODOS OS CAMPOS..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className={cn("max-w-sm", filterInputClassName)}
          />
        )}
        {activeFilterColumn && (
          <Input
            placeholder={activePlaceholder}
            value={(table.getColumn(activeFilterColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(activeFilterColumn)?.setFilterValue(event.target.value)
            }
            className={cn("max-w-sm", filterInputClassName)}
          />
        )}
      </div>
      <div
        className={cn(
          "rounded-xl border border-white/5 overflow-hidden bg-gradient-to-b from-secondary/40 to-background/40 shadow-lg",
          tableContainerClassName
        )}
      >
        <Table>
          <TableHeader className={cn("bg-secondary/30 backdrop-blur-sm", tableHeaderClassName)}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className={cn("border-b border-white/5 hover:bg-transparent", tableHeaderRowClassName)}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn("text-foreground/80 font-semibold h-12", tableHeadClassName)}
                    >
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
                  className={cn(
                    "border-b border-white/5 hover:bg-secondary/20 transition-colors data-[state=selected]:bg-primary/10",
                    tableRowClassName
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn("py-3 text-foreground/80", tableCellClassName)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className={cn("h-24 text-center text-muted-foreground", emptyCellClassName)}
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {paginationVariant === "icons" ? (
        <div
          className={cn(
            "flex items-center justify-between mt-6 pt-4 border-t border-white/10",
            paginationContainerClassName
          )}
        >
          <div className={cn("text-gray-400 text-sm", paginationInfoClassName)}>
            Página {pageIndex + 1} de {pageCount}
          </div>
          <div className={cn("flex items-center space-x-2", paginationButtonsClassName)}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className={cn("border-white/20 text-white hover:bg-white/10", paginationButtonClassName)}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={cn("border-white/20 text-white hover:bg-white/10", paginationButtonClassName)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span
              className={cn(
                "text-white px-3 py-1 bg-primary/20 rounded border border-primary/30",
                paginationCurrentPageClassName
              )}
            >
              {pageIndex + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={cn("border-white/20 text-white hover:bg-white/10", paginationButtonClassName)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              className={cn("border-white/20 text-white hover:bg-white/10", paginationButtonClassName)}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className={cn("flex items-center justify-end space-x-2 py-4", paginationContainerClassName)}>
          <div className={cn("flex-1 text-sm text-muted-foreground", paginationInfoClassName)}>
            Página {pageIndex + 1} de {pageCount}
          </div>
          <div className={cn("space-x-2", paginationButtonsClassName)}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={paginationButtonClassName}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={paginationButtonClassName}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

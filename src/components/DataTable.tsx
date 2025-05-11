import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ExpandedState,
  getExpandedRowModel,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/utils/exportUtils';

interface DataTableProps<TData extends { expandedContent?: React.ReactNode }> {
  columns: ColumnDef<TData>[];
  data: TData[];
  expandedRowIndex: number | null;
  onRowExpand: (index: number | null) => void;
  exportFilename?: string;
}

export function DataTable<TData extends { expandedContent?: React.ReactNode }>({
  columns,
  data,
  expandedRowIndex,
  onRowExpand,
  exportFilename = 'export',
}: DataTableProps<TData>) {
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    state: {
      expanded,
    },
  });

  const handleExportCSV = () => {
    exportToCSV(data, exportFilename);
  };

  const handleExportExcel = () => {
    exportToExcel(data, exportFilename);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          className="border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <React.Fragment key={row.id}>
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 align-middle text-center">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {expandedRowIndex === index && row.original.expandedContent && (
                  <tr className="bg-muted/50">
                    <td colSpan={columns.length} className="p-4 border-t">
                      {row.original.expandedContent}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

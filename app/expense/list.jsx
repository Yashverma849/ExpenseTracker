import { useEffect, useState } from "react";
import { useTable, useFilters, useGlobalFilter, usePagination } from "react-table";
import { supabase } from "@/lib/supabaseClient";

const columns = [
  {
    Header: "Amount",
    accessor: "amount",
  },
  {
    Header: "Currency",
    accessor: "currency",
  },
  {
    Header: "Date",
    accessor: "date",
  },
  {
    Header: "Category",
    accessor: "category",
  },
  {
    Header: "Note",
    accessor: "note",
  },
];

export default function List({ refresh }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("expenses").select("*");
      if (error) {
        console.error("Error fetching data:", error.message);
      } else {
        setData(data);
      }
      setLoading(false);
    };

    fetchData();
  }, [refresh]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    setGlobalFilter,
    page,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage,
    pageOptions,
    gotoPage,
    pageCount,
    setPageSize,
  } = useTable(
    {
      columns,
      data,
    },
    useFilters,
    useGlobalFilter,
    usePagination
  );

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-transparent bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-lg rounded-lg p-6 border border-white/20 text-black">
        <h1 className="text-2xl font-bold mb-4 text-white chart-colors dm-serif-text-regular">EXPENSES</h1>
        <input
          placeholder="Filter..."
          value={state.globalFilter || ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="mb-4 p-2 border rounded text-white bg-transparent"
        />
        <table {...getTableProps()} className="min-w-full bg-transparent border rounded text-white">
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps()} key={column.id} className="px-4 py-2 border-b border-r">
                    {column.render("Header")}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.length ? (
              rows.map((row) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()} key={row.original.id || row.id}>
                    {row.cells.map((cell) => (
                      <td {...cell.getCellProps()} key={cell.column.id} className="px-4 py-2 border-b border-r">
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-2 text-center">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-4">
          <div>{rows.length} row(s) selected.</div>
          <div className="space-x-2">
            <button
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              className="px-4 py-2 border rounded text-white"
            >
              Previous
            </button>
            <button
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className="px-4 py-2 border rounded text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DataTable({
  columns = [],
  rows = [],
  emptyText = "No records found",
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#FAF9F6]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-5 py-3 font-semibold text-[#111827]">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.id ?? index} className="border-t border-[#E5E7EB]">
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4 text-[#64748B]">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10 text-center text-[#64748B]">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

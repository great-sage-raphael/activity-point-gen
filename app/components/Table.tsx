import React, { ReactNode } from "react";

interface TableProps {
  headers: string[];
  data: (string | number | ReactNode)[][];
}

const Table: React.FC<TableProps> = ({ headers, data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-gray-800">
        <thead>
          <tr className="border-b-2 border-gray-200 text-gray-800">
            {headers.map((header, index) => (
              <th key={index} className="text-left py-3 px-4 text-gray-800">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100 text-gray-800">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="py-3 px-4 text-gray-800">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="py-4 text-center text-gray-900">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
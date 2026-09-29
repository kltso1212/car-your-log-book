interface TableHeaderProps {
  columns: string[];
}

export default function TableHeader({ columns }: TableHeaderProps) {
  return (
    <thead>
      <tr>
        {columns.map(c => (
          <th key={c}>{c}</th>
        ))}
      </tr>
    </thead>
  );
}

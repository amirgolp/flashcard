import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import { TableVirtuoso, TableComponents } from 'react-virtuoso'
import { Flashcard } from '../../types'

type Data = Flashcard

interface ColumnData {
  dataKey: keyof Data
  label: string
  numeric?: boolean
  width?: number
}

const columns: ColumnData[] = [
  {
    width: 150,
    label: 'German Word',
    dataKey: 'german_word',
  },
  {
    width: 150,
    label: 'English Translation',
    dataKey: 'english_translation',
  },
  {
    width: 80,
    label: 'Status',
    dataKey: 'status',
  },
]

interface VirtualizedTableProps {
  data: Data[]
  onClickItem: (id: string) => void
}

const VirtuosoTableComponents: TableComponents<Data> = {
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: (props) => (
    <Table
      {...props}
      sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }}
    />
  ),
  TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableHead {...props} ref={ref} />
  )),
  TableRow,
  TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
}

const VirtualizedTableWrapper: React.FC<VirtualizedTableProps> = ({
  data,
  onClickItem,
}) => {
  const fixedHeaderContent = () => (
    <TableRow>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          variant="head"
          align={column.numeric ? 'right' : 'left'}
          style={{ width: column.width }}
          sx={{ backgroundColor: 'background.paper' }}
        >
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  )

  const rowContent = (_index: number, row: Data) => (
    <React.Fragment>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          align={column.numeric ? 'right' : 'left'}
        >
          {row[column.dataKey]}
        </TableCell>
      ))}
    </React.Fragment>
  )

  return (
    <Paper style={{ height: 400, width: '100%' }}>
      <TableVirtuoso
        data={data}
        components={VirtuosoTableComponents}
        fixedHeaderContent={fixedHeaderContent}
        itemContent={(index, row) => (
          <TableRow hover onClick={() => onClickItem(row.id)} key={row.id}>
            {rowContent(index, row)}
          </TableRow>
        )}
      />
    </Paper>
  )
}

export default VirtualizedTableWrapper

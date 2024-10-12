import React, { ReactNode } from 'react'
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  IconButton,
} from '@mui/material'
import { Delete } from '@mui/icons-material'
import Grid from '@mui/material/Grid2'

interface BasicViewProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  onDelete?: (id: string) => void
  page?: number
  rowsPerPage?: number
  onPageChange?: (event: React.ChangeEvent<unknown>, value: number) => void
}

const BasicView = <T extends { id: string }>({
  items,
  renderItem,
  onDelete,
  page = 1,
  rowsPerPage = 10,
  onPageChange,
}: BasicViewProps<T>) => {
  return (
    <>
      {items.length === 0 ? (
        <Typography>No items available.</Typography>
      ) : (
        <>
          {rowsPerPage && onPageChange ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Details</TableCell>
                      {onDelete && <TableCell>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items
                      .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                      .map((item, index) => (
                        <TableRow key={item.id}>
                          {renderItem(item, index)}
                          {onDelete && (
                            <TableCell>
                              <IconButton onClick={() => onDelete(item.id)}>
                                <Delete />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Pagination
                count={Math.ceil(items.length / rowsPerPage)}
                page={page}
                onChange={onPageChange}
              />
            </>
          ) : (
            <Grid container spacing={3}>
              {items.map((item, index) => (
                <Grid key={item.id}>
                  {renderItem(item, index)}
                  {onDelete && (
                    <IconButton onClick={() => onDelete(item.id)}>
                      <Delete />
                    </IconButton>
                  )}
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </>
  )
}

export default BasicView

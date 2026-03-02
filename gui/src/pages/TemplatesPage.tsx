import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { listTemplates, deleteTemplate } from '../api/templates'
import type { TemplateResponse } from '../types'
import TemplateFormModal from '../components/templates/TemplateFormModal'

export default function TemplatesPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] =
    useState<TemplateResponse | null>(null)

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => listTemplates(0, 50, true),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (template: TemplateResponse) => {
    setEditingTemplate(template)
    setIsModalOpen(true)
  }

  const handeCreate = () => {
    setEditingTemplate(null)
    setIsModalOpen(true)
  }

  if (isLoading) return <Typography>Loading...</Typography>

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Flashcard Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handeCreate}
        >
          New Template
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Fields</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates?.map((template) => (
              <TableRow key={template.id}>
                <TableCell>{template.name}</TableCell>
                <TableCell>{template.description}</TableCell>
                <TableCell>
                  {template.is_default ? (
                    <Chip
                      label="System"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      label="Custom"
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>{template.fields.length} fields</TableCell>
                <TableCell align="right">
                  {!template.is_default && (
                    <>
                      <IconButton
                        onClick={() => handleEdit(template)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(template.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TemplateFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={editingTemplate}
      />
    </Box>
  )
}

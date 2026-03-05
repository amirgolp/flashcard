import { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  useDrafts,
  useUpdateDraft,
  useApproveDraft,
  useRejectDraft,
  useBulkApproveDrafts,
  useDeleteRejectedDrafts,
} from '../../hooks/useGeneration';
import { useDecks } from '../../hooks/useDecks';
import DraftReviewCard from './DraftReviewCard';
import DraftEditDialog from './DraftEditDialog';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import type { DraftCardResponse, DraftCardUpdate, DraftCardStatus, Deck } from '../../types';

interface DraftReviewListProps {
  bookId?: string;
}

const STATUS_TABS: { label: string; value: DraftCardStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export default function DraftReviewList({ bookId }: DraftReviewListProps) {
  const [statusFilter, setStatusFilter] = useState<DraftCardStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingDraft, setEditingDraft] = useState<DraftCardResponse | null>(null);
  const [bulkDeckId, setBulkDeckId] = useState<string | null>(null);

  // Queries
  const queryParams = useMemo(
    () => ({
      book_id: bookId,
      status: statusFilter === 'all' ? undefined : statusFilter,
      limit: 100,
    }),
    [bookId, statusFilter],
  );
  const { data: drafts, isLoading, error } = useDrafts(queryParams);
  const { data: decks } = useDecks(0, 100);

  // Mutations
  const updateDraft = useUpdateDraft();
  const approveDraft = useApproveDraft();
  const rejectDraft = useRejectDraft();
  const bulkApprove = useBulkApproveDrafts();
  const deleteRejected = useDeleteRejectedDrafts();

  // Derived
  const pendingDrafts = useMemo(
    () => (drafts ?? []).filter((d: DraftCardResponse) => d.status === 'pending'),
    [drafts],
  );
  const hasRejected = useMemo(
    () => (drafts ?? []).some((d: DraftCardResponse) => d.status === 'rejected'),
    [drafts],
  );

  // Handlers
  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    const allPendingIds = pendingDrafts.map((d: DraftCardResponse) => d.id);
    setSelectedIds(new Set(allPendingIds));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleApprove = (id: string, deckId?: string) => {
    approveDraft.mutate({ id, deckId });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleReject = (id: string) => {
    rejectDraft.mutate(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleEdit = (draft: DraftCardResponse) => {
    setEditingDraft(draft);
  };

  const handleEditSave = (data: DraftCardUpdate) => {
    if (!editingDraft) return;
    updateDraft.mutate(
      { id: editingDraft.id, data },
      { onSuccess: () => setEditingDraft(null) },
    );
  };

  const handleBulkApprove = () => {
    if (selectedIds.size === 0) return;
    bulkApprove.mutate(
      {
        draft_ids: Array.from(selectedIds),
        deck_id: bulkDeckId ?? undefined,
      },
      { onSuccess: () => setSelectedIds(new Set()) },
    );
  };

  const handleDeleteRejected = () => {
    deleteRejected.mutate(bookId);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: DraftCardStatus | 'all') => {
    setStatusFilter(newValue);
    setSelectedIds(new Set());
  };

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading drafts..." />;
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error">
        {error instanceof Error ? error.message : 'Failed to load drafts.'}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Status filter tabs */}
      <Tabs
        value={statusFilter}
        onChange={handleTabChange}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {STATUS_TABS.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            value={tab.value}
            icon={tab.value === 'all' ? <FilterListIcon fontSize="small" /> : undefined}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {/* Bulk actions toolbar */}
      {pendingDrafts.length > 0 && (
        <Toolbar
          variant="dense"
          disableGutters
          sx={{
            mb: 2,
            gap: 1.5,
            flexWrap: 'wrap',
            minHeight: 'auto',
            py: 1,
          }}
        >
          <Button
            size="small"
            startIcon={<SelectAllIcon />}
            onClick={selectedIds.size === pendingDrafts.length ? handleDeselectAll : handleSelectAll}
            variant="outlined"
          >
            {selectedIds.size === pendingDrafts.length ? 'Deselect All' : 'Select All'}
          </Button>

          {selectedIds.size > 0 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                {selectedIds.size} selected
              </Typography>

              <Autocomplete
                size="small"
                options={decks ?? []}
                getOptionLabel={(option: Deck) => option.name}
                value={decks?.find((d: Deck) => d.id === bulkDeckId) ?? null}
                onChange={(_, v) => setBulkDeckId(v?.id ?? null)}
                sx={{ minWidth: 200 }}
                renderInput={(params) => (
                  <TextField {...params} label="Target Deck (optional)" size="small" />
                )}
              />

              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={handleBulkApprove}
                disabled={bulkApprove.isPending}
              >
                {bulkApprove.isPending ? 'Approving...' : `Approve ${selectedIds.size}`}
              </Button>
            </>
          )}

          {hasRejected && (
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteRejected}
              disabled={deleteRejected.isPending}
              sx={{ ml: 'auto' }}
            >
              {deleteRejected.isPending ? 'Deleting...' : 'Delete Rejected'}
            </Button>
          )}
        </Toolbar>
      )}

      {/* Empty state */}
      {(!drafts || drafts.length === 0) ? (
        <EmptyState
          icon={<FilterListIcon />}
          title="No drafts found"
          description={
            bookId
              ? 'Generate flashcards from a book to see drafts here.'
              : 'Select a book and generate flashcards to get started.'
          }
        />
      ) : (
        /* Draft cards grid */
        <Grid container spacing={3}>
          {drafts.map((draft: DraftCardResponse) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2.4 }} key={draft.id}>
              <DraftReviewCard
                draft={draft}
                selected={selectedIds.has(draft.id)}
                onToggle={() => handleToggle(draft.id)}
                onApprove={(deckId) => handleApprove(draft.id, deckId)}
                onReject={() => handleReject(draft.id)}
                onEdit={() => handleEdit(draft)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit dialog */}
      <DraftEditDialog
        open={editingDraft !== null}
        draft={editingDraft}
        onClose={() => setEditingDraft(null)}
        onSave={handleEditSave}
        isSaving={updateDraft.isPending}
      />
    </Box>
  );
}

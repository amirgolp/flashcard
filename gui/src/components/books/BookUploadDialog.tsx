import { useState, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useUploadBook } from '../../hooks/useBooks';

interface BookUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (bookId: string) => void;
}

export default function BookUploadDialog({ open, onClose, onSuccess }: BookUploadDialogProps) {
  const [title, setTitle] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadBook();

  const reset = () => {
    setTitle('');
    setTargetLanguage('');
    setNativeLanguage('');
    setFile(null);
    setError('');
  };

  const handleClose = () => {
    if (!upload.isPending) {
      reset();
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== 'application/pdf') {
        setError('Only PDF files are supported');
        return;
      }
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.pdf$/i, ''));
      setError('');
    }
  };

  const handleSubmit = () => {
    if (!file || !title.trim()) return;
    setError('');
    upload.mutate(
      {
        file,
        title: title.trim(),
        targetLanguage: targetLanguage || undefined,
        nativeLanguage: nativeLanguage || undefined,
      },
      {
        onSuccess: (book) => {
          reset();
          onSuccess(book.id);
        },
        onError: (err) => setError(err instanceof Error ? err.message : 'Upload failed'),
      },
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Book</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <input type="file" accept=".pdf" hidden ref={fileInputRef} onChange={handleFileChange} />
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={upload.isPending}
          >
            {file ? file.name : 'Select PDF File'}
          </Button>
          {file && (
            <Typography variant="caption" color="text.secondary">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </Typography>
          )}

          <TextField
            required
            fullWidth
            label="Book Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={upload.isPending}
          />
          <TextField
            fullWidth
            label="Target Language (e.g. German)"
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            disabled={upload.isPending}
          />
          <TextField
            fullWidth
            label="Native Language (e.g. English)"
            value={nativeLanguage}
            onChange={(e) => setNativeLanguage(e.target.value)}
            disabled={upload.isPending}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={upload.isPending}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!file || !title.trim() || upload.isPending}
        >
          {upload.isPending ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

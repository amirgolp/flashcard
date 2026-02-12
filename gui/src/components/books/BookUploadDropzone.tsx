import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../utils/api';
import type { StorageQuota } from '../../types';

interface BookUploadDropzoneProps {
    onUploadSuccess?: (bookId: string) => void;
    onUploadError?: (error: string) => void;
}

export default function BookUploadDropzone({
    onUploadSuccess,
    onUploadError,
}: BookUploadDropzoneProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Fetch storage quota
    const { data: quota, isLoading: quotaLoading } = useQuery<StorageQuota>({
        queryKey: ['storage', 'quota'],
        queryFn: async () => {
            const response = await fetchWithAuth('/storage/quota');
            if (!response.ok) throw new Error('Failed to fetch quota');
            return response.json();
        },
    });

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;

            const file = acceptedFiles[0];
            setError(null);
            setSuccess(false);

            // Validate quota
            if (quota) {
                if (quota.file_count >= quota.max_files) {
                    setError(`You have reached your file limit (${quota.max_files} files). Delete some files or upgrade your plan.`);
                    onUploadError?.(
                        `File limit reached (${quota.max_files} files)`
                    );
                    return;
                }

                if (quota.used_bytes + file.size > quota.max_bytes) {
                    const remainingMB = ((quota.max_bytes - quota.used_bytes) / 1024 / 1024).toFixed(2);
                    setError(
                        `Insufficient storage space. You have ${remainingMB} MB remaining, but this file is ${(file.size / 1024 / 1024).toFixed(2)} MB.`
                    );
                    onUploadError?.('Insufficient storage space');
                    return;
                }
            }

            // Validate file size (10MB max)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                setError(`File is too large. Maximum size is 10 MB, but this file is ${(file.size / 1024 / 1024).toFixed(2)} MB.`);
                onUploadError?.('File too large');
                return;
            }

            // Validate file type
            if (file.type !== 'application/pdf') {
                setError('Only PDF files are supported');
                onUploadError?.('Invalid file type');
                return;
            }

            // Upload file
            setUploading(true);
            setUploadProgress(10);

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetchWithAuth('/books/upload', {
                    method: 'POST',
                    body: formData,
                });

                setUploadProgress(90);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Upload failed');
                }

                const book = await response.json();
                setUploadProgress(100);
                setSuccess(true);
                onUploadSuccess?.(book.id);

                // Reset after delay
                setTimeout(() => {
                    setSuccess(false);
                    setUploadProgress(0);
                }, 3000);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed');
                onUploadError?.(err instanceof Error ? err.message : 'Upload failed');
            } finally {
                setUploading(false);
            }
        },
        [quota, onUploadSuccess, onUploadError]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        maxFiles: 1,
        disabled: uploading || quotaLoading,
    });

    const usedPercentage = quota
        ? Math.round((quota.used_bytes / quota.max_bytes) * 100)
        : 0;

    return (
        <Box>
            {/* Quota Display */}
            {quota && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                        Storage Usage
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={usedPercentage}
                                sx={{
                                    height: 8,
                                    borderRadius: 1,
                                    bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                        bgcolor: usedPercentage > 80 ? 'error.main' : 'primary.main',
                                    },
                                }}
                            />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                            {usedPercentage}%
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                            label={`${quota.file_count} / ${quota.max_files} files`}
                            size="small"
                            color={quota.file_count >= quota.max_files ? 'error' : 'default'}
                        />
                        <Chip
                            label={`${(quota.used_bytes / 1024 / 1024).toFixed(2)} MB / ${(quota.max_bytes / 1024 / 1024).toFixed(0)} MB`}
                            size="small"
                        />
                        <Chip label={quota.subscription_tier} size="small" color="primary" variant="outlined" />
                    </Box>
                </Paper>
            )}

            {/* Dropzone */}
            <Paper
                {...getRootProps()}
                sx={{
                    p: 4,
                    textAlign: 'center',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'divider',
                    bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        borderColor: uploading ? 'divider' : 'primary.main',
                        bgcolor: uploading ? 'background.paper' : 'action.hover',
                    },
                }}
            >
                <input {...getInputProps()} />

                {uploading ? (
                    <Box>
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Uploading...
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={uploadProgress}
                            sx={{ maxWidth: 400, mx: 'auto', mb: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {uploadProgress}%
                        </Typography>
                    </Box>
                ) : success ? (
                    <Box>
                        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                        <Typography variant="h6" color="success.main">
                            Upload Successful!
                        </Typography>
                    </Box>
                ) : isDragActive ? (
                    <Box>
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6">Drop your PDF here</Typography>
                    </Box>
                ) : (
                    <Box>
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Drag and drop a PDF file here
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            or click to browse your files
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                            Maximum file size: 10 MB • PDF files only
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Error Message */}
            {error && (
                <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Success Message */}
            {success && !error && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    File uploaded successfully! The book has been added to your library.
                </Alert>
            )}
        </Box>
    );
}

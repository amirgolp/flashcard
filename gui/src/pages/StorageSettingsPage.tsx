import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TelegramIcon from '@mui/icons-material/Telegram';
import CloudIcon from '@mui/icons-material/Cloud';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '../../utils/api';
import type { StorageQuota, StorageConfig, TelegramStorageConfig, GoogleDriveAuthResponse } from '../../types';

interface StorageQuota {
    used_bytes: number;
    max_bytes: number;
    file_count: number;
    max_files: number;
    subscription_tier: string;
}

interface StorageConfig {
    storage_type: string | null;
    is_configured: boolean;
    quota: StorageQuota;
}

export default function StorageSettingsPage() {
    const [activeTab, setActiveTab] = useState(0);
    const [telegramToken, setTelegramToken] = useState('');
    const [telegramUserId, setTelegramUserId] = useState('');
    const queryClient = useQueryClient();

    // Fetch storage config
    const { data: config, isLoading } = useQuery<StorageConfig>({
        queryKey: ['storage', 'config'],
        queryFn: async () => {
            const response = await fetchWithAuth('/storage/config');
            if (!response.ok) throw new Error('Failed to fetch config');
            return response.json();
        },
    });

    // Configure Telegram mutation
    const telegramMutation = useMutation({
        mutationFn: async (data: { bot_token: string; user_id: string }) => {
            const response = await fetchWithAuth('/storage/configure/telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Configuration failed');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['storage', 'config'] });
            setTelegramToken('');
            setTelegramUserId('');
        },
    });

    // Google Drive auth mutation
    const googleDriveMutation = useMutation<GoogleDriveAuthResponse>({
        mutationFn: async () => {
            const response = await fetchWithAuth('/storage/configure/google-drive/auth');
            if (!response.ok) throw new Error('Failed to initiate OAuth');
            return response.json();
        },
        onSuccess: (data) => {
            // Redirect to Google OAuth
            window.location.href = data.authorization_url;
        },
    });

    // Disconnect storage mutation
    const disconnectMutation = useMutation({
        mutationFn: async () => {
            const response = await fetchWithAuth('/storage/disconnect', {
                method: 'POST',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to disconnect');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['storage', 'config'] });
        },
    });

    const handleTelegramSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        telegramMutation.mutate({ bot_token: telegramToken, user_id: telegramUserId });
    };

    const usedPercentage = config
        ? Math.round((config.quota.used_bytes / config.quota.max_bytes) * 100)
        : 0;

    if (isLoading) {
        return (
            <Box>
                <Typography variant="h4" gutterBottom>
                    Storage Settings
                </Typography>
                <LinearProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight={600}>
                Storage Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Configure where your PDF files are stored. Choose between Telegram (your Saved Messages) or
                Google Drive.
            </Typography>

            {/* Current Configuration Status */}
            {config && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Current Configuration
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    {config.is_configured ? (
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CheckCircleIcon color="success" />
                                <Box>
                                    <Typography variant="body1" fontWeight={600}>
                                        Storage Configured
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Using: {config.storage_type === 'telegram' ? 'Telegram' : 'Google Drive'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Quota Display */}
                            <Box>
                                <Typography variant="body2" fontWeight={600} gutterBottom>
                                    Storage Usage
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={usedPercentage}
                                    sx={{
                                        height: 10,
                                        borderRadius: 1,
                                        mb: 1,
                                        bgcolor: 'grey.200',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: usedPercentage > 80 ? 'error.main' : 'primary.main',
                                        },
                                    }}
                                />
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={`${config.quota.file_count} / ${config.quota.max_files} files`}
                                        size="small"
                                        color={config.quota.file_count >= config.quota.max_files ? 'error' : 'default'}
                                    />
                                    <Chip
                                        label={`${(config.quota.used_bytes / 1024 / 1024).toFixed(2)} MB / ${(config.quota.max_bytes / 1024 / 1024).toFixed(0)} MB`}
                                        size="small"
                                    />
                                    <Chip
                                        label={config.quota.subscription_tier}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>

                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => disconnectMutation.mutate()}
                                disabled={disconnectMutation.isPending || config.quota.file_count > 0}
                            >
                                Disconnect Storage
                            </Button>
                            {config.quota.file_count > 0 && (
                                <Typography variant="caption" color="error">
                                    Delete all files before disconnecting storage
                                </Typography>
                            )}
                        </Stack>
                    ) : (
                        <Alert severity="warning" icon={<InfoIcon />}>
                            No storage configured. Please choose a storage option below.
                        </Alert>
                    )}
                </Paper>
            )}

            {/* Configuration Tabs */}
            <Paper>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab icon={<TelegramIcon />} label="Telegram" iconPosition="start" />
                    <Tab icon={<CloudIcon />} label="Google Drive" iconPosition="start" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {/* Telegram Tab */}
                    {activeTab === 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Configure Telegram Storage
                            </Typography>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                <Typography variant="body2" gutterBottom>
                                    <strong>How to set up:</strong>
                                </Typography>
                                <ol style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                    <li>Open Telegram and search for @BotFather</li>
                                    <li>Send <code>/newbot</code> and follow the instructions</li>
                                    <li>Copy the bot token</li>
                                    <li>Search for @userinfobot on Telegram</li>
                                    <li>Send any message to get your User ID</li>
                                    <li>Paste both below</li>
                                </ol>
                            </Alert>

                            <form onSubmit={handleTelegramSubmit}>
                                <Stack spacing={2}>
                                    <TextField
                                        fullWidth
                                        label="Bot Token"
                                        value={telegramToken}
                                        onChange={(e) => setTelegramToken(e.target.value)}
                                        placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                                        required
                                        helperText="Your Telegram bot token from BotFather"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Telegram User ID"
                                        value={telegramUserId}
                                        onChange={(e) => setTelegramUserId(e.target.value)}
                                        placeholder="123456789"
                                        required
                                        helperText="Your Telegram user ID (numeric)"
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={telegramMutation.isPending}
                                        startIcon={<TelegramIcon />}
                                    >
                                        {telegramMutation.isPending ? 'Configuring...' : 'Configure Telegram'}
                                    </Button>
                                </Stack>
                            </form>

                            {telegramMutation.isError && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {telegramMutation.error.message}
                                </Alert>
                            )}
                            {telegramMutation.isSuccess && (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    Telegram storage configured successfully!
                                </Alert>
                            )}
                        </Box>
                    )}

                    {/* Google Drive Tab */}
                    {activeTab === 1 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Configure Google Drive Storage
                            </Typography>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Files will be stored in your personal Google Drive. You'll need to grant permission
                                for the app to upload and manage files.
                            </Alert>

                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => googleDriveMutation.mutate()}
                                disabled={googleDriveMutation.isPending}
                                startIcon={<CloudIcon />}
                                fullWidth
                            >
                                {googleDriveMutation.isPending
                                    ? 'Redirecting...'
                                    : 'Connect Google Drive'}
                            </Button>

                            {googleDriveMutation.isError && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {googleDriveMutation.error.message}
                                </Alert>
                            )}
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

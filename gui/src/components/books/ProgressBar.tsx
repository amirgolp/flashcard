import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

interface ProgressBarProps {
  currentPage: number;
  totalPages: number;
  label?: string;
}

export default function ProgressBar({ currentPage, totalPages, label }: ProgressBarProps) {
  const pct = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <Box>
      {label && <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress variant="determinate" value={pct} sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} />
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 48 }}>
          {pct}%
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Page {currentPage} of {totalPages}
      </Typography>
    </Box>
  );
}

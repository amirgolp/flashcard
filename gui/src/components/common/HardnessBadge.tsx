import { Chip } from '@mui/material';

interface HardnessBadgeProps {
  level: 'easy' | 'medium' | 'hard';
}

const colorMap: Record<HardnessBadgeProps['level'], 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

const labelMap: Record<HardnessBadgeProps['level'], string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export default function HardnessBadge({ level }: HardnessBadgeProps) {
  return <Chip label={labelMap[level]} color={colorMap[level]} size="small" />;
}

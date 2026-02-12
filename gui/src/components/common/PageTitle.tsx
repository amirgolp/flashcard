import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageTitle({ title, subtitle, action }: PageTitleProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        mb: 3,
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="h4" component="h1" fontWeight={600}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && (
        <Box sx={{ flexShrink: 0 }}>
          {action}
        </Box>
      )}
    </Box>
  );
}

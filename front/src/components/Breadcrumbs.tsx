import React from 'react'
import { Breadcrumbs as MUIBreadcrumbs, Link, Typography } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'

const Breadcrumbs: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const pathnames = location.pathname.split('/').filter((x) => x)

  return (
    <MUIBreadcrumbs aria-label="breadcrumb" style={{ margin: '16px' }}>
      {/* Link to "/" instead of "/decks" */}
      <Link
        color="inherit"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
      >
        Home
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        return isLast ? (
          <Typography color="textPrimary" key={to}>
            {decodeURIComponent(value)}
          </Typography>
        ) : (
          <Link
            color="inherit"
            onClick={() => navigate(to)}
            key={to}
            style={{ cursor: 'pointer' }}
          >
            {decodeURIComponent(value)}
          </Link>
        )
      })}
    </MUIBreadcrumbs>
  )
}

export default Breadcrumbs

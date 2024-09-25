import React from 'react'
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from 'react-router-dom'

type Ref = HTMLAnchorElement

const Link = React.forwardRef<Ref, RouterLinkProps>((props, ref) => (
  <RouterLink ref={ref} {...props} />
))

export default Link

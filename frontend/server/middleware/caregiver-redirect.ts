export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (url.pathname !== '/caregiver' && !url.pathname.startsWith('/caregiver/')) return

  let destination = '/mitra'
  if (url.pathname === '/caregiver/dashboard') {
    destination = '/mitra/dashboard'
  } else if (url.pathname.startsWith('/caregiver/')) {
    destination = `/mitra/profil${url.pathname.slice('/caregiver'.length)}`
  }

  return sendRedirect(event, `${destination}${url.search}`, 308)
})

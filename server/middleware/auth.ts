export default defineEventHandler((event) => {
  const header = getHeader(event, 'authorization')
  if (header?.startsWith('Bearer guest_')) {
    event.context.guestToken = header.slice(7)
  }
})

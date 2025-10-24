export default defineEventHandler(async (event) => {
  return {
    success: true,
    message: 'API工作正常',
    timestamp: new Date().toISOString()
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// DROP-IN SNIPPET FOR backend/src/index.ts
//
// Add these two lines to your existing src/index.ts, alongside the other
// route registrations:
//
//   import qrRoutes from './routes/qr'
//   app.use('/api/qr', qrRoutes)
//
// That's all. The full updated block should look like:
//
//   app.use('/api/auth',   authRoutes)
//   app.use('/api/events', eventsRoutes)
//   app.use('/api/orders', ordersRoutes)
//   app.use('/api/users',  usersRoutes)
//   app.use('/api/qr',     qrRoutes)      ← ADD THIS
//
// ─────────────────────────────────────────────────────────────────────────────
export {}

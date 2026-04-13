import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter         from './routes/auth'
import categoriesRouter   from './routes/categories'
import transactionsRouter from './routes/transactions'
import dashboardRouter    from './routes/dashboard'

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth',         authRouter)
app.use('/api/categories',   categoriesRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/dashboard',    dashboardRouter)

export default app

// Só sobe o servidor HTTP quando executado diretamente (não no Vercel)
if (require.main === module) {
  const port = process.env.PORT ?? 3001
  app.listen(port, () => console.log(`Backend running on http://localhost:${port}`))
}

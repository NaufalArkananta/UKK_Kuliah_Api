import Express from 'express'
import userRoute from './routes/user.route'
import menuRoute from './routes/menu.route'

const app = Express()

app.use(Express.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use('/api', userRoute)
app.use('/api', menuRoute)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
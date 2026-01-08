import Express from 'express'

const app = Express()

app.use(Express.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
import Express from 'express'
import userRoute from './routes/user.route'
import menuRoute from './routes/menu.route'
import diskonRoute from './routes/diskon.route'
import orderRoute from './routes/order.route'
import notaRoute from './routes/nota.route'

const path = require('path');
const cors = require('cors');
const express = require('express');

const app = Express()

app.use('/menuImage', express.static('public/menuImage'));
app.use('/userImage', express.static('public/userImage'));

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(Express.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use('/api', userRoute)
app.use('/api', menuRoute)
app.use('/api', diskonRoute)
app.use('/api', orderRoute)
app.use('/api', notaRoute)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
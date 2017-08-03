var app = require('./express')

require('dotenv').config()                 // loading env vars from .env into process.env
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var passport = require('passport')


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cookieParser())
app.use(session({
    secret: process.env.WD_SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())


// configure a public directory to host static content
app.use(app.express.static(__dirname + '/public'))
app.use('/bower_components', app.express.static(__dirname + '/bower_components'))
app.use('/node_modules', app.express.static(__dirname + '/node_modules'))

require('./server/app')

var port = process.env.PORT || 3000

var http = require('http').Server(app);
var io = require('socket.io')(http);

var socketQueue = []

io.on('connection', function (socket) {
    socket.on('join game', function (username) {

        var room

        if (socketQueue.length === 0) {
            socket.join(socket.id)
            socketQueue.push(socket)
            console.log('Player (socket id: ' + socket.id + ') named ' + username + ' joins ' + socket.id)
        } else {
            var opponentSocket = socketQueue.shift()  // dequeue, now?
            room = opponentSocket.id
            socket.join(room)
            io.to(room).emit('joins room', username)
            console.log('Player (socket id: ' + socket.id + ') named ' + username + ' joins ' + room)
        }
    })

    socket.on('share initial data', function (data) {
        var room = Object.keys(socket.adapter.rooms)[1]
        io.to(room).emit('share initial data', data)
    })

})

var server = http.listen(port)

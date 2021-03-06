var mongoose = require('mongoose')

var connectionString = 'mongodb://localhost/tic-tac-toe' // for local
if (process.env.MLAB_USERNAME_WEBDEV) {              // check if running remotely
    var username = process.env.MLAB_USERNAME_WEBDEV  // get from environment
    var password = process.env.MLAB_PASSWORD_WEBDEV
    connectionString = 'mongodb://' + username + ':' + password
    connectionString += '@ds043200.mlab.com:43200/heroku_mkcqdh44'
}

mongoose.connect(connectionString, { useMongoClient: true })
mongoose.Promise = require('q').Promise

require('./services/user.service.server')
require('./services/game.service.server')
require('./services/move.service.server')

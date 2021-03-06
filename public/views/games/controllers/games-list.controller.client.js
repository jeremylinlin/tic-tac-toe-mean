(function () {
    angular
        .module('ttt')
        .controller('gamesListController', gamesListController)

    function gamesListController(currentUser, userService, gameService, $routeParams, $location, $timeout) {
        var model = this
        model.getGamesInfo = getGamesInfo
        model.removeGame = removeGame
        model.isAdmin = isAdmin
        model.logout = userService.logout

        init()

        function init() {
            model.user = currentUser
            console.log(model.isAdmin(model.user))
            var userId = $routeParams['userId']
            getGamesInfo(userId)
        }

        function getGamesInfo(userId) {
            var promise

            if (isAdmin(currentUser) && !userId) {
                promise = gameService.findAllGames()  // admin viewing /games does not need a userId
            } else {
                if (!userId)  userId = currentUser._id
                promise = gameService.findAllGamesByUser(userId)
            }

            return promise
                .then(function (games) {
                    console.log(games)
                    games.forEach(function (game) {
                        if      (game._winner === '0')  game.result = 'Ties'
                        else if (!game._winner)
                            game.result = 'Player left before game ends'
                        else if (isAdmin(currentUser)) {
                            switch (game._winner) {
                                case '3' : game.result = 'Computer';             break;
                                case '1' : game.result = game._player1.username; break;
                                case '2' : game.result = game._player2.username; break;
                            }
                        }
                        else if (game._winner === '3')  game.result = 'Lost'  // lost to robot
                        else {
                            if (game._winner === '1' && currentUser._id === game._player1._id ||
                                game._winner === '2' && currentUser._id === game._player2._id)
                                game.result = 'Wins'
                            else
                                game.result = 'Lost'
                        }
                    })
                    model.games = games
                                            // https://stackoverflow.com/a/22541080/3949193
                    $timeout(function () {  // executes callback after DOM has finished rendering
                        $('td:contains(Wins)').css('color', 'green')
                        $('td:contains(Lost)').css('color', 'red')
                        $('td:contains(Ties)').css('color', 'blue')
                    })
                })
                .catch(function (err) {
                    console.log(err)
                    $location.url('/')
                })
        }

        function removeGame(gameId) {
            return gameService
                .removeGame(gameId)
                .then(function () {
                    console.log('Game removed successfully.')

                    // removing the game at the front end
                    var gameToBeRemoved = model.games.find(function (game) {
                        return game._id === gameId
                    })
                    model.games.splice(model.games.indexOf(gameToBeRemoved), 1)
                })
        }

        function isAdmin(user) {
            return user.roles.indexOf('ADMIN') >= 0
        }
    }
})()

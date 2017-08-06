(function () {
    angular
        .module('ttt')
        .controller('gameOnlineController', gameOnlineController)

    function gameOnlineController(currentUser, gameService, gameHelpers, moveService, socket) {
        var model = this
        model.user = currentUser
        model.addSocketIOListeners = addSocketIOListeners
        model.joinRoom = joinRoom
        model.startGame = startGame
        model.gameInProgress = gameInProgress
        model.makeMove = makeMove
        model.afterMove = afterMove
        model.gridChanged = gridChanged

        addSocketIOListeners(socket)

        init()

        function init() {
            model.shared = {
                grid: 3
            }
            model.gridChanged(model.shared.grid)
        }

        function startGame(grid) {
            model.moves = 0

            model.rows = new Array(grid).fill(0)
            model.cols = new Array(grid).fill(0)
            model.dia1 = 0
            model.dia2 = 0
        }

        function gameInProgress() {
            return gameHelpers.gameInProgress(model)
        }

        function joinRoom() {
            gameHelpers.resetGame()
            socket.emit('join room', currentUser)
            if (!gameHelpers.gameInProgress(model)) {
                gameHelpers.showMessage(model, 'Waiting for your opponent...')
            }
        }

        /**
         * After a user make a move,
         * 0. check if it is a valid move
         * 1. insert the move in db
         * 2. check if the game ends (the current user wins / the game ties) after this move
         *    - if so
         *      * insert the winner (playerId / 'tie') in db for this game
         *      * set model.result accordingly
         *    - otherwise
         * 3. socket emit
         *    - move
         *    - gameResult (if game end)
         */
        function makeMove(position, isMyTurn) {
            if (isMyTurn && gameInProgress() && gameHelpers.moveOnEmptyCell(position)) {
                model.isMyTurn = !model.isMyTurn
                var move = {
                    position: position,
                    _player: currentUser._id
                }
                return moveService
                    .makeMove(move, model.shared.game.board)
                    .then(function (move) {
                        var winner = gameHelpers.checkWinner(model, move, currentUser)
                        if (winner) {
                            return gameService
                                .addWinnerToGame(model.shared.game, winner)
                                .then(function (game) {
                                    move.winner = winner
                                    return move
                                })

                        } else {
                            return move
                        }
                    })
                    .then(function (move) {
                        socket.emit('move made', move)
                    })
            }
        }

        function afterMove(model) {
            return function (move) {
                model.moves++

                var winner = move.winner

                if (winner) {
                    if (winner === 0) model.result = "It's a tie."
                    else {
                        if (winner === 1 && currentUser._id === model.shared.game._player1 ||
                            winner === 2 && currentUser._id === model.shared.game._player2) {
                            model.result = 'You win :)'
                        } else {
                            model.result = 'You lose :('
                        }
                    }
                    socket.emit('game over')
                }

                var cssClass = move._player === model.shared.game._player1 ? 'move-made-X' : 'move-made-O'
                $("td[data-move=" + move.position + "]").addClass(cssClass)

                if (move._player !== currentUser._id) {  // the other player's turn is already flipped RIGHT AFTER
                    model.isMyTurn = !model.isMyTurn     // he makes the move; otherwise, the network delay may
                }                                        // enable him to quickly make move multiple times

                console.log(!model.result ? 'ongoing' : model.result)
            }
        }

        function gridChanged(newGrid) {
            if (!Number.isInteger(newGrid) || newGrid < 3 || newGrid > 10) {
                if (Number.isInteger(newGrid) && newGrid > 10) {
                    newGrid = 10
                } else {
                    newGrid = 3
                }
                gameHelpers.showMessage(model, 'Please enter a number between 3 and 10.')
            }
            model.rowIndex = gameHelpers.toNumsArray(newGrid)
            model.colIndex = gameHelpers.toNumsArray(newGrid)
        }

        function addSocketIOListeners(socket) {
            socket.on('game starts', function (user) {  // 2nd player joins
                console.log(user.username + ' joins the room')
                if (user._id !== currentUser._id) {   // 1st player creates game

                    var _player1 = currentUser._id    // 2nd players gets the 2nd turn
                    var _player2 = user._id

                    var grid = model.shared.grid
                    if (grid >= 3) grid = grid > 10 ? 10 : grid
                    else           grid = 3

                    model.shared.grid = grid

                    var game = {
                        grid: grid,
                        _player1: _player1,
                        _player2: _player2
                    }

                    return gameService
                        .createGame(game)
                        .then(function (game) {
                            model.shared.game = game
                            console.log('sharing share initial data')
                            socket.emit('share initial data', model.shared)  // send shared data two two clients
                            model.isMyTurn = 1
                        })

                } else {
                    delete model.result
                    model.isMyTurn = 0  // second person gets the second turn
                }

            })

            socket.on('sharing initial data', function (data) {
                model.shared = data
                model.gridChanged(data.grid) // change the table accordingly as its row and col number changes

                startGame(model.shared.grid) // create data structures needed for the game logic

                delete model.result          // remove the previous game result if any
                gameHelpers.showMessage(model, 'Game starts!')
                console.log('synced initialized data')

            })

            socket.on('move made', afterMove(model))
        }
    }
})()

(function () {
    angular
        .module("ttt")
        .factory("userService", function ($location, $http) {
            var api = {}

            api.registerUser = registerUser
            api.unregisterUser = unregisterUser
            api.validateCredentials = validateCredentials
            api.findUserById = findUserById
            api.findUserByUserName = findUserByUserName
            api.findAllUsers = findAllUsers
            api.login = login
            api.logout = logout
            api.upsertUser = upsertUser
            api.updateUser = updateUser
            api.deleteUser = deleteUser
            api.checkLoggedIn = checkLoggedIn
            api.checkAdmin = checkAdmin

            return api

            function registerUser(user) {
                var url = '/api/users'
                return $http.post(url, user)
                    .then(function (response) {
                        return response.data
                    })
            }

            function unregisterUser(userId) {
                var url = '/api/users/' + userId
                return $http.delete(url)
                    .then(function (response) {
                        return response.data
                    })
            }

            function findUserById(userId) {
                var url = '/api/users/' + userId
                return $http.get(url).then(function (response) {  // returns a promise object to controller
                    return response.data  // the user object (success) or error
                })
            }

            function findUserByUserName(username) {
                var url = '/api/users?username=' + username
                return $http.get(url)
                    .then(function (response) {
                        if (response.data.error) {  // 若返回的数据中包含在 server 添加的 error 信息
                            throw response.data     // 则作为一个 error throw 给 register controller 让他 catch
                        }                           // 然后作为 model.error render 在页面上
                        return response.data
                    })
            }

            function findAllUsers() {
                var url = '/api/admin/users'
                return $http.get(url)
                    .then(function (response) {
                        return response.data
                    })
            }

            function login(username, password) {
                var url = '/api/login'
                var credentials = {
                    username: username,
                    password: password
                }
                return $http.post(url, credentials).then(function (response) {
                    return response.data
                })
            }

            function logout() {
                var url = '/api/logout'
                return $http.post(url)
                    .then(function (response) {
                        $location.url('/')
                    })
            }

            function updateUser(userId, updatedUser) {
                var url = '/api/users/' + userId
                return $http.put(url, updatedUser)
                    .then(function (response) {
                        return response.data
                    })
                    .catch(function (response) {
                        throw response.data
                    })
            }
            
            function upsertUser(user) {
                var promiseObj = user._id ? updateUser(user._id, user) : registerUser(user)
                return promiseObj
                    .then(function (response) {
                        return response.data
                    })
                    .catch(function (response) {
                        throw response
                    })
            }

            function deleteUser(userId) {
                var url = '/api/admin/users/' + userId
                return $http.delete(url)
                    .then(function (response) {
                        return response.data
                    })
            }

            function checkLoggedIn() {
                var url = '/api/checkLoggedIn'
                return $http.get(url)
                    .then(function (response) {  // will response back either
                        return response.data     // - currentUser
                    })                           // - '0'
            }

            function checkAdmin() {
                var url = '/api/checkAdmin'
                return $http.get(url)
                    .then(function (response) {
                        return response.data
                    })
            }

            function validateCredentials(username, password, passwordConfirm) {
                var model = {}
                if (Array.from(arguments).map(function (field) {
                        return field == null || field === ''
                    }).reduce(function (res, bool) { return res || bool }, false)) {

                    if (arguments.length === 1) {
                        model.error = 'Username is required.'      // profile update page
                    } else {
                        model.error = 'All fields are required.'   // register page
                    }
                } else if (arguments.length > 1) {
                    if (password !== passwordConfirm) {
                        model.error = 'Passwords do not match.'
                    // } else if (password.length < 6) {
                    //     model.error = 'Password must be more than 6 characters.'
                    }
                }
                return model.error
            }

        })
})()

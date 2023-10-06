const passport = require("passport")

const Errors = require("./errors")


module.exports.setup = (service, app, config) => {
    if(!config)
    {
        return
    }

    app.use(passport.initialize())
    app.use(passport.session())

    if(config.strategies)
    {
        config.strategies(service).forEach((strategy, index) => {
            passport.use(String(index), strategy)
        })
    }
    
    passport.serializeUser((user, callback) => {
        return Promise.resolve(user)
            .then(config.serializeUser(service))
            .then((serialised) => {
                callback(null, serialised)
            })
            .catch((error) => {
                callback(error)
            })
    })
    passport.deserializeUser((id, callback) => {
        return Promise.resolve(id)
            .then(config.deserializeUser(service))
            .then((deserialised) => {
                callback(null, deserialised)
            })
            .catch((error) => {
                callback(error)
            })
    })

    service.authentication = {
        validateUser: (req) => {
            if(!req.isAuthenticated())
            {
                throw new Errors.Unauthorized("Unauthorized access.")
            }
        },
        authenticate: () => {
            var strategies = config.strategies(service).map((_, index) => String(index))

            return passport.authenticate(strategies)
        },
        logout: () => {
            return (req, _, next) => {
                if(req.isAuthenticated())
                {
                    req.logout()
                }

                next()
            }
        }
    }
}

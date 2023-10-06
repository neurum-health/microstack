const session = require("express-session")
const SessionStore = require("express-mysql-session")


function getStore(config) {
    const sessionConfig = config.session
    const dbConfig = config.database

    if(!sessionConfig || !dbConfig)
    {
        return
    }

    return new SessionStore({
        host: dbConfig.connection.host,
        user: dbConfig.connection.user,
        password: dbConfig.connection.password,
        database: sessionConfig.database
    })
}


module.exports.getStore = getStore


module.exports.setup = (app, config) => {
    const sessionConfig = config.session
    const store = getStore(config)

    if(!sessionConfig || !store)
    {
        return
    }

    app.use(session({
        key: sessionConfig.key, 
        secret: sessionConfig.secret,
        resave: true,
        saveUninitialized: true,
        store: store,
        cookie: {
            maxAge: 30 * 24 * 3600000
        }
    }))
}

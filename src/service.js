const path = require("path")
const http = require('http')
const express = require("express")
const bodyParser = require("body-parser")

const Controllers = require("./controllers")
const Routing = require("./routing")
const Session = require("./session")
const Socket = require("./socket")
const Database = require("./database")
const Authentication = require("./authentication")
const Dependency = require("./dependency")
const Renderer = require("./renderer")
const logger = require("./logger")
const cors = require("cors")
const {parseQueryString} = require("./helpers")



function loadDependencies(config) {
    let dependencies = {}

    for(let name in config)
    {
        dependencies[name] = new Dependency(config[name])
    }

    return dependencies
}


function Service(config) {
    let app = express()

    app.set("query parser", parseQueryString)

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({
        extended: true
    }))

    if (config.cors) {
        app.use(cors({ 
            credentials: config.cors.credentials, 
            origin: config.cors.origin 
        }));
    }

    let server = http.Server(app)

    if(config.database)
    {
        this.database = new Database(config.database)
    }

    if(config.dependencies)
    {
        this.dependencies = loadDependencies(config.dependencies)
    }

    Controllers.setup(this, config)
    Session.setup(app, config)
    Authentication.setup(this, app, config.authentication)
    Routing.setup(this, app, config)
    Socket.setup(this, server, config)
    Renderer.setup(this, config)

    this.start = () => {
        const port = config.host.port

        return new Promise((resolve) => {
            server.listen(port, () => {
                resolve()
            })
        })
    }

    this.stop = () => {
        return new Promise((resolve) => {
            server.close(() => {
                resolve()
            })
        })
    }
}


module.exports = Service

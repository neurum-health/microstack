const SocketIO = require("socket.io")
const PassportSocketIO = require("passport.socketio")
const cookieParser = require('cookie-parser')

const logger = require("./logger")
const {getStore} = require("./session")


function setupEvents(service, client, user) {
    let controllers = service.controllers.all
    for(let path in controllers)
    {
        const controller = controllers[path]
        const routingConfig = controller.config.routing

        if(routingConfig && routingConfig.socket)
        {
            addRouting(service, client, user, controller, path)
        }
    }
}


function addRouting(service, client, user, controller, path) {
    client.on(path, (message) => {
        const data = message.data || {}

        Promise.resolve()
            .then(() => {
                controller.validate(data)
            })
            .then(() => {
                data.socket = client

                controller(data, user)
            })
            .catch((error) => {
                logger.info(`Error performing socket event: ${error.message}`)
            })
    })
}


module.exports.setup = (service, server, config) => {
    const socketConfig = config.socket

    if(!socketConfig)
    {
        return
    }

    const io = SocketIO(server)

    if(config.authentication)
    {
        const sessionConfig = config.session
        const store = getStore(config)

        if(!sessionConfig || !store)
        {
            return
        }

        io.use(PassportSocketIO.authorize({
            cookieParser: cookieParser,
            key: sessionConfig.key, 
            secret: sessionConfig.secret,
            store: store
        }))
    }

    io.on("connection", (client) => {
        const user = client.request.user

        logger.info(`User has connected to service`, user)

        if(socketConfig.connect)
        {
            const controller = service.controllers.get(socketConfig.connect.api)
            if(controller)
            {
                controller({
                    socket: client
                }, user)
            }
        }

        if(socketConfig.disconnect)
        {
            const controller = service.controllers.get(socketConfig.disconnect.api)
            if(controller)
            {
                client.on("disconnect", () => {
                    controller({
                        socket: client
                    }, user)
                })
            }
        }

        setupEvents(service, client, user)
    })

    service.socket = Object.freeze({
        send: (name, data) => {
            io.emit(name, {
                data: data
            })
        },
        sendUser: (userId, name, data) => {
            PassportSocketIO.filterSocketsByUser(io, (user) => {
                return user.id === userId
            }).forEach((socket) => {
                socket.emit(name, {
                    data: data
                })
            })
        },
        sendUsers: (userIds, name, data) => {
            PassportSocketIO.filterSocketsByUser(io, (user) => {
                return userIds.includes(user.id)
            }).forEach((socket) => {
                socket.emit(name, {
                    data: data
                })
            })
        }
    })
}

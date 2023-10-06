const express = require("express")
const HttpStatus = require("http-status-codes")
const Busboy = require("busboy")
 
const Errors = require("./errors")
const logger = require("./logger")


function setupApi(service, app, config) {
    if(!config || config.path == null)
    {
        return
    }

    let controllers = service.controllers.all
    for(let path in controllers) 
    {
        const controller = controllers[path]
        const routingConfig = controller.config.routing

        if(routingConfig)
        {
            const routingPath = `${config.path}/${routingConfig.path || path}`

            addApiRouting(service, app, controller, routingPath)
        }
    }
}


function setupIndex(service, app, config) {
    if(service.controllers.has("index"))
    {
        const controller = service.controllers.get("index")

        addApiRouting(service, app, controller, "/")
    }
}


function addApiRouting(service, app, controller, routingPath) {
    const routingConfig = controller.config.routing
    
    if(routingConfig && routingConfig.http)
    {
        const httpConfig = routingConfig.http
        const handler = handleApiRequest(service, controller, routingPath)

        if(httpConfig.get)
        {
            app.get(routingPath, handler)
        }
        if(httpConfig.post)
        {
            app.post(routingPath, handler)
        }
        if(httpConfig.put)
        {
            app.put(routingPath, handler)
        }
        if(httpConfig.delete)
        {
            app.delete(routingPath, handler)
        }
    }
}


function authenticateUser(service, apiAuth, req) {
    return () => {
        if(service.authentication && apiAuth && apiAuth.isRequired)
        {
            service.authentication.validateUser(req)
        }
    }
}


function handleFileStreaming(controller, req, parameters) {
    return () => {
        const properties = controller.config.parameters.properties
        const fileConfig = controller.config.routing.http.file
        if(!fileConfig || !properties)
        {
            return Promise.resolve()
        }

        const busboy = new Busboy({
            headers: req.headers,
            limits: fileConfig.limits || {
                fileSize: 2 * 1024 * 1024
            }
        })

        return new Promise((resolve, reject) => {
            busboy.on("file", function(name, file, filename, encoding, mimetype) {
                const property = properties[name]
                if(!property || property.type !== "file")
                {
                    logger.info("Invalid file request", {
                        parameters: parameters
                    })

                    return reject(new Errors.BadRequest("Invalid request"))
                }

                if(property.mimetype && !property.mimetype.includes(mimetype))
                {
                    logger.info("Invalid file request unexpected mimetype", {
                        name: name,
                        mimetype: mimetype
                    })

                    return reject(new Errors.BadRequest("Invalid request"))
                }

                let buffers = []
                file.on("data", function(data) {
                    buffers.push(data)
                })
                file.on("end", function() {
                    parameters[name] = Buffer.concat(buffers)
                })
            })

            busboy.on("field", function(name, value) {
                parameters[name] = value
            })

            busboy.on("finish", function() {
                resolve()
            })

            req.pipe(busboy)
        })
    }
}


function validateParameters(controller, parameters) {
    return () => {
        controller.validate(parameters)
    }
}


function callController(controller, req, parameters) {
    return () => {
        return controller(parameters, req.user)
    }
}


function performApiRequest(config, controller, routingPath, req, res, parameters) {
    return () => {
        return Promise.resolve()
            .then(() => {
                logger.info(`API ${routingPath} called with`, {
                    parameters: parameters
                })        
            })
            .then(handleFileStreaming(controller, req, parameters))
            .then(validateParameters(controller, parameters))
            .then(callController(controller, req, parameters))
            .then((response) => {
                logger.info(`API ${routingPath} response`, {
                    response: response
                })

                if(typeof response === "string" ||
                    (config.routing && config.routing.response && config.routing.response.isRaw))
                {
                    return res.send(response)
                }

                return res.send({
                    success: true,
                    data: response || {}
                })
            })
            .catch(handleApiError(res))
    }
}


function cleanRequest(parameters) {
    return Object.keys(parameters).reduce((map, key) => {
        const value = parameters[key]

        if (value !== null) {
 			if (typeof value === "object" && !Array.isArray(value)) {
				map[key] = cleanRequest(value)
            } else {
            	map[key] = value
            }
        }

        return map;
    }, {})
}


function handleApiRequest(service, controller, routingPath) {
    return (req, res) => {
        const parameters = cleanRequest(
            Object.assign({}, req.query, req.body, req.params))
        const config = controller.config

        return Promise.resolve(req, res)
            .then(authenticateUser(service, config.authentication, req))
            .then(performApiRequest(config, controller, routingPath, req, res, parameters))
            .catch(handleApiError(res))
    }
} 


function handleApiError(res) {
    return (error) => {
        if(!error.code)
        {
            logger.warn(`Unknown error performing request: ${error.message}`)
        }

        return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).send({
            success: false,
            error: {
                code: error.code || HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
                data: error.data
            }
        })
    }
}


function setupAuthentication(service, app, config) {
    const authConfig = config.authentication
    const apiConfig = config.routing.api

    if(!service.authentication || !authConfig)
    {
        return
    }

    const login = authConfig.login
    if(login && (login.api || login.path) && apiConfig)
    {
        const controller = service.controllers.get(login.api)
        const loginPath = login.path || login.api

        app.post(
            `${apiConfig.path}/${loginPath}`,
            service.authentication.authenticate(),
            (req, res) => {
                if(controller)
                {
                    return performApiRequest(
                        controller.config, controller, loginPath, req,
                        res, req.body)()
                }
                else
                {
                    res.send({
                        success: true
                    })
                }
            })
    }

    const logout = authConfig.logout
    if(logout && (logout.api || logout.path) && apiConfig)
    {
        const controller = service.controllers.get(logout.api)
        const logoutPath = logout.path || logout.api
        
        app.use(
            `${apiConfig.path}/${logoutPath}`,
            service.authentication.logout(),
            (req, res) => {
                if(controller)
                {
                    return performApiRequest(
                        controller.config, controller, logoutPath, req,
                        res, req.body || req.query)()
                }
                else
                {
                    res.send({
                        success: true
                    })
                }
            })
    }
}


function setupHealthCheck(app) {
    app.use("/health", (req, res) => {
        res.send({
            success: true,
            data: {}
        })
    })
}


function setupResources(app) {
    app.use(express.static("public"))
}


function setupNotFound(service, app, config) {
    app.use((req, res) => {
        res.status(404)

        if(service.controllers.has("404")) {
            const controller = service.controllers.get("404")

            return performApiRequest(
                controller.config, controller, "", req,
                res, {}
            )()
            .catch(() => {
                res.type("txt").send("Not found")
            })
        }
        else
        {
            if(req.accepts("json"))
            {
                res.send({
                    success: false,
                    message: "Not found"
                })
            }
            else
            {
                res.type("txt").send("Not found")
            }
        }
    })
}


module.exports.setup = (service, app, config) => {
    const routingConfig = config.routing

    setupApi(service, app, routingConfig.api)
    setupIndex(service, app, routingConfig.api)
    setupAuthentication(service, app, config)
    setupHealthCheck(app)
    setupResources(app)
    setupNotFound(service, app, routingConfig)
}

const path = require("path")
const fs = require("fs")
const jsonschema = require("jsonschema")
 
const Errors = require("./errors")
const logger = require("./logger")
const ModuleLoader = require("./moduleloader")


function Controllers(service, config) {
    if(!config || !config.location)
    {
        return
    }

    const directory = path.join(process.cwd(), config.location)
    let controllers = {}
 
    loadControllersDirectory(service, controllers, "", directory)
    controllers = Object.freeze(controllers)

    Object.defineProperties(this, {
        get: {
            value: (path) => {
                if(path === undefined)
                {
                    return null
                }
                
                let controller = controllers[path]
                if(!controller)
                {
                    throw new Errors.BadRequest("Not found")
                }
                
                return controller
            }
        },
        all: {
            get: () => {
                return controllers
            }
        },
        has: {
            value: (path) => {
                return !!controllers[path]
            }
        }
    })
}


function loadControllersDirectory(service, controllers, routingPath, directory) {
    for(const fileName of fs.readdirSync(directory))
    {
        const filePath = path.join(directory, fileName)
 
        if(fs.lstatSync(filePath).isDirectory())
        {
            const folderRoutingPath = `${routingPath}${fileName}/`
            loadControllersDirectory(service, controllers, folderRoutingPath, filePath)
        }
        else
        {
            const controllerRoutingPath = `${routingPath}${fileName.slice(0, -3)}`
            
            controllers[controllerRoutingPath] = loadController(service, filePath)       
        }
    }
}


function parseConfig(config) {
    config = JSON.parse(JSON.stringify(config))

    let properties = config.parameters.properties
    let routingConfig = config.routing
    if(!properties || !routingConfig || !routingConfig.http)
    {
        return config
    }


    let totalSizeLimit = 0
    let numberOfFiles = 0

    for (let [key, value] of Object.entries(properties))
    {
        if(value.type !== "file")
        {
            continue
        }

        numberOfFiles++

        if(value.limit)
        {
            totalSizeLimit += value.limit
        }
    }

    
    if(numberOfFiles && !routingConfig.http.file)
    {
        routingConfig.http.file = {
            limits: {
                fileSize: totalSizeLimit,
                files: numberOfFiles
            }
        }
    }

    return config
}


function loadController(service, filepath) {
    const controller = ModuleLoader.load(filepath)
    const config = parseConfig(controller.config)
    const instance = controller(service)
    
    instance.validate = (parameters) => {
        const validator = new jsonschema.Validator()
        const result = validator.validate(parameters, config.parameters)
        const errors = result.errors

        if(errors && errors.length)
        {
            logger.info("Invalid request with", {
                parameters: parameters,
                errors: errors
            })

            throw new Errors.BadRequest("Invalid request")
        }
    }
    instance.config = Object.freeze(config)
    
    return instance
}


module.exports.setup = (service, config) => {
    const routingConfig = config.routing

    service.controllers = new Controllers(service, routingConfig.api)
}

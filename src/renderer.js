const path = require("path")

const pug = require("pug")

const Errors = require("./errors")
const logger = require("./logger")


class RenderError extends Errors.ControllerError {
    constructor(message, code, status) {
        super(message, code, status)
    }
}


function renderFile(directory, viewName, data) {
    const location = path.join(directory, viewName + ".pug")
    data = data || {}
    data.basedir = directory

    return Promise.resolve()
        .then(() => {
            return pug.renderFile(location, data)
        })
        .catch((error) => {
            logger.error("Error rendering content:", error.message)
            
            throw new RenderError("Error rendering content.")
        })
}


module.exports.setup = (service, config) => {
    if(!config || !config.views || !config.views.location)
    {
        return
    }

    const directory = path.join(process.cwd(), config.views.location)

    service.render = renderFile.bind(null, directory)
}

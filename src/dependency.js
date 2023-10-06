const request = require("request-promise-native")

const Errors = require("./errors")
const logger = require("./logger")


class RequestError extends Errors.ControllerError {
    constructor(message, code, status, data) {
        super(message, code, status, data)
    }
}


function Dependency(config) {
    const rootUrl = `http://${config.name}`

    function sendRequest(method, path, parameters) {
        const url = `${rootUrl}/api/${path}`
        const useQueryString = ["GET", "DELETE"].includes(method)
        parameters = parameters || {}

        return request({
            method: method,
            url: url,
            qs: useQueryString ? parameters : undefined,
            body: !useQueryString ? parameters : undefined,
            json: true
        }).then((response) => {
            if(!response.success)
            {
                if(response.error)
                {
                    const message = response.error.message

                    logger.info(`Error calling ${url}: ${message}`, "parameters", parameters)

                    throw new RequestError(message, response.error.code, 200, response.error.data)
                }
                else
                {
                    throw new RequestError(
                        `Unexpected success response calling ${url}: ${JSON.stringify(response)}`)
                }
            }

            return response.data || {}
        }, (error) => {
            const status = error.statusCode

            if(error.response)
            {
                const body = error.response.body

                if(body && body.error)
                {
                    const message = body.error.message

                    logger.warn(`Error calling ${url}: ${message}`, "parameters", parameters)

                    throw new RequestError(message, body.error.code, status, body.error.data)
                }
            }

            throw new RequestError(
                `Unknown error calling ${url}: ${error.message}`)
        })
    }

    return {
        api: {
            get: sendRequest.bind(null, "GET"),
            post: sendRequest.bind(null, "POST"),
            put: sendRequest.bind(null, "PUT"),
            delete: sendRequest.bind(null, "DELETE")
        }
    }
}


module.exports = Dependency

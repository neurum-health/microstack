const DeepMock = require("jest-deep-mock")

const {SERVICE_NAME, API_PATH, ERROR_CODE, ERROR_MESSAGE} = require("../helpers/constants")

jest.mock("request-promise-native")

jest.mock("../../src/logger")


let Dependency
let request
let config


beforeEach(() => {
    Dependency = require("../../src/dependency")

    request = require("request-promise-native")

    config = {
        name: SERVICE_NAME
    }
})


describe("Dependency::sendRequest", () => {
    let dependency
    let parameters

    beforeEach(() => {
        dependency = new Dependency(config)

        parameters = {
            one: "value"
        }
    })

    test("GET success", () => {
        // GIVEN
        let response = {
            success: true,
            data: {
                test: "value"
            }
        }
        request.mockReturnValue(Promise.resolve(response))

        // WHEN
        return dependency.api.get(API_PATH, parameters)
            .then((data) => {
                // THEN
                expect(data).toEqual(response.data)

                expect(request).toHaveBeenCalledWith({
                    method: "GET",
                    url: `http://${SERVICE_NAME}/api/${API_PATH}`,
                    qs: parameters,
                    body: undefined,
                    json: true
                })
            })
    })

    test("POST success", () => {
        // GIVEN
        let response = {
            success: true,
            data: {
                test: "value"
            }
        }
        request.mockReturnValue(Promise.resolve(response))

        // WHEN
        return dependency.api.post(API_PATH, parameters)
            .then((data) => {
                // THEN
                expect(data).toEqual(response.data)

                expect(request).toHaveBeenCalledWith({
                    method: "POST",
                    url: `http://${SERVICE_NAME}/api/${API_PATH}`,
                    qs: undefined,
                    body: parameters,
                    json: true
                })
            })
    })

    test("PUT success", () => {
        // GIVEN
        let response = {
            success: true,
            data: {
                test: "value"
            }
        }
        request.mockReturnValue(Promise.resolve(response))

        // WHEN
        return dependency.api.put(API_PATH, parameters)
            .then((data) => {
                // THEN
                expect(data).toEqual(response.data)

                expect(request).toHaveBeenCalledWith({
                    method: "PUT",
                    url: `http://${SERVICE_NAME}/api/${API_PATH}`,
                    qs: undefined,
                    body: parameters,
                    json: true
                })
            })
    })

    test("DELETE success", () => {
        // GIVEN
        let response = {
            success: true,
            data: {
                test: "value"
            }
        }
        request.mockReturnValue(Promise.resolve(response))

        // WHEN
        return dependency.api.delete(API_PATH, parameters)
            .then((data) => {
                // THEN
                expect(data).toEqual(response.data)

                expect(request).toHaveBeenCalledWith({
                    method: "DELETE",
                    url: `http://${SERVICE_NAME}/api/${API_PATH}`,
                    qs: undefined,
                    body: parameters,
                    json: true
                })
            })
    })

    test("success no parameters", () => {
        // GIVEN
        let response = {
            success: true,
            data: {
                test: "value"
            }
        }
        request.mockReturnValue(Promise.resolve(response))

        // WHEN
        return dependency.api.get(API_PATH)
            .then((data) => {
                // THEN
                expect(data).toEqual(response.data)
            })
    })

    test("success no data", () => {
        // GIVEN
        let response = {
            success: true,
            data: null
        }
        request.mockReturnValue(Promise.resolve(response))

        // WHEN
        return dependency.api.get(API_PATH, parameters)
            .then((data) => {
                // THEN
                expect(data).toEqual({})
            })
    })

    test("error in success response", () => {
        // GIVEN
        let response = {
            success: false,
            error: {
                code: ERROR_CODE,
                message: ERROR_MESSAGE
            }
        }
        request.mockReturnValue(Promise.resolve(response))

        // WHEN
        return dependency.api.get(API_PATH, parameters)
            .catch((data) => {
                // THEN
                expect(data.code).toEqual(ERROR_CODE)
                expect(data.message).toEqual(
                    `Error calling http://${SERVICE_NAME}/api/${API_PATH}: ${ERROR_MESSAGE}`)
            })
    })

    test("unrecognised success response", () => {
        // GIVEN
        let response = {}
        request.mockReturnValue(Promise.resolve(response))

        // WHEN
        return dependency.api.get(API_PATH, parameters)
            .catch((data) => {
                // THEN
                expect(data.code).toEqual(500)
                expect(data.message).toEqual(
                    `Unexpected success response calling http://${SERVICE_NAME}/api/${API_PATH}: {}`)
            })
    })

    test("error response", () => {
        // GIVEN
        let response = {
            success: false,
            error: {
                code: ERROR_CODE,
                message: ERROR_MESSAGE
            }
        }

        let error = new DeepMock()
        error.statusCode = 500
        error.response = {
            body: response
        }
        
        request.mockReturnValue(Promise.reject(error))

        // WHEN
        return dependency.api.get(API_PATH, parameters)
            .catch((data) => {
                // THEN
                expect(data.code).toEqual(ERROR_CODE)
                expect(data.message).toEqual(
                    `Error calling http://${SERVICE_NAME}/api/${API_PATH}: ${ERROR_MESSAGE}`)
            })
    })

    test("error response no error structure", () => {
        // GIVEN
        let response = {
            success: false
        }

        let error = new DeepMock()
        error.message = ERROR_MESSAGE
        error.statusCode = 500
        error.response = {
            body: response
        }
        
        request.mockReturnValue(Promise.reject(error))

        // WHEN
        return dependency.api.get(API_PATH, parameters)
            .catch((data) => {
                // THEN
                expect(data.code).toEqual(500)
                expect(data.message).toEqual(
                    `Unknown error calling http://${SERVICE_NAME}/api/${API_PATH}: ${ERROR_MESSAGE}`)
            })
    })

    test("unknown error", () => {
        // GIVEN
        let error = new DeepMock()
        error.message = ERROR_MESSAGE
        error.statusCode = null
        error.response = null
        
        request.mockReturnValue(Promise.reject(error))

        // WHEN
        return dependency.api.get(API_PATH, parameters)
            .catch((data) => {
                // THEN
                expect(data.code).toEqual(500)
                expect(data.message).toEqual(
                    `Unknown error calling http://${SERVICE_NAME}/api/${API_PATH}: ${ERROR_MESSAGE}`)
            })
    })
})

const DeepMock = require("jest-deep-mock")


jest.mock("path")
jest.mock("fs")
jest.mock("express")
jest.mock("jsonschema")
 
jest.mock("../../src/moduleloader")
jest.mock("../../src/logger")


let Routing
let fs, path, express, jsonschema, ModuleLoader
let mockService, mockApp, mockStatic, mockValidator
let config


beforeEach(() => {
    Routing = require("../../src/routing")

    fs = require("fs")
    path = require("path")

    express = require("express")
    express.static = jest.fn().mockReturnValue(mockStatic)

    mockValidator = new DeepMock()

    jsonschema = require("jsonschema")
    jsonschema.Validator = mockValidator

    ModuleLoader = require("../../src/moduleloader")
    ModuleLoader.load = new DeepMock()

    process.cwd = new DeepMock()

    mockService = new DeepMock()
    mockApp = new DeepMock()

    config = {
        routing: {
            api: {
                location: "api",
                path: "/api"
            }
        }
    }
})

describe("Routing::setup", () => {
    test("No API config", () => {
        // WHEN
        Routing.setup(mockService, mockApp, {routing: {}})

        // THEN
        expect(fs.readdirSync).not.toHaveBeenCalled()

        expect(mockApp.get).not.toHaveBeenCalled()
        expect(mockApp.post).not.toHaveBeenCalled()

        expect(mockApp.use).toHaveBeenCalledWith("/health", expect.any(Function))
        expect(mockApp.use).toHaveBeenCalledWith("/public", mockStatic)
        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function))
    })

    test("No routing", () => {
        // GIVEN
        path.join = jest.fn()
            .mockReturnValueOnce("TEST_LOCATION")
            .mockReturnValueOnce("TEST_LOCATION/api.js")

        fs.readdirSync = jest.fn().mockReturnValue(["api.js"])
        fs.lstatSync = jest.fn().mockReturnValue({
            isDirectory: jest.fn().mockReturnValue(false)
        })

        let mockApiConfig = {}
        let mockApiInstance = jest.fn()

        let mockApi = jest.fn().mockReturnValue(mockApiInstance)
        mockApi.config = mockApiConfig
        
        ModuleLoader.load.mockReturnValue(mockApi)

        // WHEN
        Routing.setup(mockService, mockApp, config)

        // THEN
        expect(mockApp.get).not.toHaveBeenCalled()
        expect(mockApp.post).not.toHaveBeenCalled()

        expect(mockApp.use).toHaveBeenCalledWith("/health", expect.any(Function))
        expect(mockApp.use).toHaveBeenCalledWith("/public", mockStatic)
        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function))
    })

    test("No HTTP routes", () => {
        // GIVEN
        path.join = jest.fn()
            .mockReturnValueOnce("TEST_LOCATION")
            .mockReturnValueOnce("TEST_LOCATION/api.js")

        fs.readdirSync = jest.fn().mockReturnValue(["api.js"])
        fs.lstatSync = jest.fn().mockReturnValue({
            isDirectory: jest.fn().mockReturnValue(false)
        })

        let mockApiConfig = {routing: {}}
        let mockApiInstance = jest.fn()

        let mockApi = jest.fn().mockReturnValue(mockApiInstance)
        mockApi.config = mockApiConfig
        
        ModuleLoader.load.mockReturnValue(mockApi)

        // WHEN
        Routing.setup(mockService, mockApp, config)

        // THEN
        expect(mockApp.get).not.toHaveBeenCalled()
        expect(mockApp.post).not.toHaveBeenCalled()

        expect(mockApp.use).toHaveBeenCalledWith("/health", expect.any(Function))
        expect(mockApp.use).toHaveBeenCalledWith("/public", mockStatic)
        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function))
    })

    test("HTTP Routes", () => {
        // GIVEN
        path.join = jest.fn()
            .mockReturnValueOnce("TEST_LOCATION")
            .mockReturnValueOnce("TEST_LOCATION/api.js")

        fs.readdirSync = jest.fn().mockReturnValue(["api.js"])
        fs.lstatSync = jest.fn().mockReturnValue({
            isDirectory: jest.fn().mockReturnValue(false)
        })

        let mockApiConfig = {
            routing: {
                http: {
                    get: true,
                    post: true,
                    put: true,
                    delete: true
                }
            }
        }
        let mockApiInstance = jest.fn()

        let mockApi = jest.fn().mockReturnValue(mockApiInstance)
        mockApi.config = mockApiConfig
        
        ModuleLoader.load.mockReturnValue(mockApi)

        // WHEN
        Routing.setup(mockService, mockApp, config)

        // THEN
        expect(mockApp.get).toHaveBeenCalledWith("/api/api", expect.any(Function))
        expect(mockApp.post).toHaveBeenCalledWith("/api/api", expect.any(Function))
        expect(mockApp.put).toHaveBeenCalledWith("/api/api", expect.any(Function))
        expect(mockApp.delete).toHaveBeenCalledWith("/api/api", expect.any(Function))

        expect(mockApp.use).toHaveBeenCalledWith("/health", expect.any(Function))
        expect(mockApp.use).toHaveBeenCalledWith("/public", mockStatic)
        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function))
    })

    test("Nested API with HTTP Routes", () => {
        // GIVEN
        path.join = jest.fn()
            .mockReturnValueOnce("TEST_LOCATION")
            .mockReturnValueOnce("TEST_LOCATION/api.js")

        fs.readdirSync = jest.fn()
            .mockReturnValueOnce(["folder"])
            .mockReturnValueOnce(["api.js"])
        fs.lstatSync = jest.fn()
            .mockReturnValueOnce({
                isDirectory: jest.fn().mockReturnValue(true)
            })
            .mockReturnValueOnce({
                isDirectory: jest.fn().mockReturnValue(false)
            })

        let mockApiConfig = {
            routing: {
                http: {
                    get: true
                }
            }
        }
        let mockApiInstance = jest.fn()

        let mockApi = jest.fn().mockReturnValue(mockApiInstance)
        mockApi.config = mockApiConfig
        
        ModuleLoader.load.mockReturnValue(mockApi)

        // WHEN
        Routing.setup(mockService, mockApp, config)

        // THEN
        expect(mockApp.get).toHaveBeenCalledWith("/api/folder/api", expect.any(Function))

        expect(mockApp.use).toHaveBeenCalledWith("/health", expect.any(Function))
        expect(mockApp.use).toHaveBeenCalledWith("/public", mockStatic)
        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function))
    })

    test("Setup authentication", () => {
        // GIVEN
        config.authentication = {
            login: {
                api: "login"
            },
            logout: {
                api: "logout"
            }
        }

        let mockAuthenticate = new DeepMock()
        mockService.authentication.authenticate.mockReturnValue(mockAuthenticate)

        path.join = jest.fn()
            .mockReturnValueOnce("TEST_LOCATION")
            .mockReturnValueOnce("TEST_LOCATION/api.js")

        fs.readdirSync = jest.fn().mockReturnValue(["api.js"])
        fs.lstatSync = jest.fn().mockReturnValue({
            isDirectory: jest.fn().mockReturnValue(false)
        })

        let mockApiConfig = {}
        let mockApiInstance = jest.fn()

        let mockApi = jest.fn().mockReturnValue(mockApiInstance)
        mockApi.config = mockApiConfig
        
        ModuleLoader.load.mockReturnValue(mockApi)

        // WHEN
        Routing.setup(mockService, mockApp, config)

        // THEN
        expect(mockApp.post).toHaveBeenCalledWith(
            "/api/login", mockAuthenticate, expect.any(Function))
        expect(mockApp.post).toHaveBeenCalledWith("/api/logout", expect.any(Function))

        expect(mockApp.use).toHaveBeenCalledWith("/api/logout", expect.any(Function))
        expect(mockApp.use).toHaveBeenCalledWith("/health", expect.any(Function))
        expect(mockApp.use).toHaveBeenCalledWith("/public", mockStatic)
        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function))
    })

    test("Setup authentication no api config", () => {
        // GIVEN
        config.authentication = {}

        let mockAuthenticate = new DeepMock()
        mockService.authentication.authenticate.mockReturnValue(mockAuthenticate)

        path.join = jest.fn()
            .mockReturnValueOnce("TEST_LOCATION")
            .mockReturnValueOnce("TEST_LOCATION/api.js")

        fs.readdirSync = jest.fn().mockReturnValue(["api.js"])
        fs.lstatSync = jest.fn().mockReturnValue({
            isDirectory: jest.fn().mockReturnValue(false)
        })

        let mockApiConfig = {}
        let mockApiInstance = jest.fn()

        let mockApi = jest.fn().mockReturnValue(mockApiInstance)
        mockApi.config = mockApiConfig
        
        ModuleLoader.load.mockReturnValue(mockApi)

        // WHEN
        Routing.setup(mockService, mockApp, config)

        // THEN
        expect(mockApp.get).not.toHaveBeenCalled()
        expect(mockApp.post).not.toHaveBeenCalled()
        
        expect(mockApp.use).toHaveBeenCalledWith("/health", expect.any(Function))
        expect(mockApp.use).toHaveBeenCalledWith("/public", mockStatic)
        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function))
    })
})

describe("Routing::handleApiRequest", () => {
    let handler
    let mockApiConfig, mockApiInstance, mockValidatorInstance
    let parameterSchema = {}

    beforeEach(() => {
        path.join = jest.fn()
            .mockReturnValueOnce("TEST_LOCATION")
            .mockReturnValueOnce("TEST_LOCATION/api.js")

        fs.readdirSync = jest.fn().mockReturnValue(["api.js"])
        fs.lstatSync = jest.fn().mockReturnValue({
            isDirectory: jest.fn().mockReturnValue(false)
        })

        mockValidatorInstance = new DeepMock()
        mockValidator.mockReturnValue(mockValidatorInstance)

        mockApiConfig = {
            routing: {
                http: {
                    get: true
                }
            },
            parameters: parameterSchema
        }
        mockApiInstance = new DeepMock()

        let mockApi = jest.fn().mockReturnValue(mockApiInstance)
        mockApi.config = mockApiConfig
        
        ModuleLoader.load.mockReturnValue(mockApi)

        Routing.setup(mockService, mockApp, config)

        handler = mockApp.get.mock.calls[0][1]
    })

    test("Invalid GET parameters", () => {
        // GIVEN
        let request = {
            method: "GET",
            query: {
                test: "value"
            }
        }
        let response = new DeepMock()
        response.status.mockReturnValue(response)

        mockValidatorInstance.validate.mockReturnValue({
            errors: ["ERROR"]
        })

        // WHEN
        return handler(request, response)
            .then((data) => {
                // THEN
                expect(mockValidatorInstance.validate).toHaveBeenCalledWith(
                    request.query, parameterSchema)

                expect(response.status).toHaveBeenCalledWith(400)
                expect(response.send).toHaveBeenCalledWith({
                    success: false,
                    error: {
                        code: 400,
                        message: "Invalid request"
                    }
                })
            })
    })

    test("Invalid POST parameters", () => {
        // GIVEN
        let request = {
            method: "POST",
            body: {
                test: "value"
            }
        }
        let response = new DeepMock()
        response.status.mockReturnValue(response)

        mockValidatorInstance.validate.mockReturnValue({
            errors: ["ERROR"]
        })

        // WHEN
        return handler(request, response)
            .then((data) => {
                // THEN
                expect(mockValidatorInstance.validate).toHaveBeenCalledWith(
                    request.body, parameterSchema)

                expect(response.status).toHaveBeenCalledWith(400)
                expect(response.send).toHaveBeenCalledWith({
                    success: false,
                    error: {
                        code: 400,
                        message: "Invalid request"
                    }
                })
            })
    })

    test("Unauthorised user", () => {
        // GIVEN
        let request = {
            method: "GET",
            query: {}
        }
        let response = new DeepMock()
        response.status.mockReturnValue(response)

        let authError = new DeepMock()
        authError.status = 404
        authError.code = 404
        authError.message = "ERROR"

        mockValidatorInstance.validate.mockReturnValue({errors: []})
        mockService.authentication.validateUser.mockThrowValue(authError)

        mockApiConfig.authentication = {
            isRequired: true
        }

        // WHEN
        return handler(request, response)
            .then((data) => {
                // THEN
                expect(mockService.authentication.validateUser).toHaveBeenCalledWith(request)

                expect(mockValidatorInstance.validate).not.toHaveBeenCalledWith()

                expect(response.status).toHaveBeenCalledWith(404)
                expect(response.send).toHaveBeenCalledWith({
                    success: false,
                    error: {
                        code: 404,
                        message: "ERROR"
                    }
                })
            })
    })

    test("GET success", () => {
        // GIVEN
        let responseData = {
            "one": "data"
        }
        let request = {
            method: "GET",
            query: {
                test: "value"
            }
        }
        let response = new DeepMock()
        response.status.mockReturnValue(response)

        mockValidatorInstance.validate.mockReturnValue({errors: []})
        mockApiInstance.mockReturnValue(responseData)

        // WHEN
        return handler(request, response)
            .then((data) => {
                // THEN
                expect(mockValidatorInstance.validate).toHaveBeenCalledWith(
                    request.query, parameterSchema)

                expect(mockApiInstance).toHaveBeenCalled()

                expect(response.status).not.toHaveBeenCalled()
                expect(response.send).toHaveBeenCalledWith({
                    success: true,
                    data: responseData
                })
            })
    })

    test("GET no response data", () => {
        // GIVEN
        let request = {
            method: "GET",
            query: {
                test: "value"
            }
        }
        let response = new DeepMock()
        response.status.mockReturnValue(response)

        mockValidatorInstance.validate.mockReturnValue({errors: []})
        mockApiInstance.mockReturnValue(null)

        // WHEN
        return handler(request, response)
            .then((data) => {
                // THEN
                expect(mockValidatorInstance.validate).toHaveBeenCalledWith(
                    request.query, parameterSchema)

                expect(mockApiInstance).toHaveBeenCalled()

                expect(response.status).not.toHaveBeenCalled()
                expect(response.send).toHaveBeenCalledWith({
                    success: true,
                    data: {}
                })
            })
    })

    test("GET error", () => {
        // GIVEN
        let responseError = new DeepMock()
        responseError.status = 123
        responseError.code = 456
        responseError.message = "ERROR"

        let request = {
            method: "GET",
            query: {
                test: "value"
            }
        }
        let response = new DeepMock()
        response.status.mockReturnValue(response)

        mockValidatorInstance.validate.mockReturnValue({errors: []})
        mockApiInstance.mockThrowValue(responseError)

        // WHEN
        return handler(request, response)
            .then((data) => {
                // THEN
                expect(mockValidatorInstance.validate).toHaveBeenCalledWith(
                    request.query, parameterSchema)

                expect(mockApiInstance).toHaveBeenCalled()

                expect(response.status).toHaveBeenCalledWith(123)
                expect(response.send).toHaveBeenCalledWith({
                    success: false,
                    error: {
                        code: 456,
                        message: "ERROR"
                    }
                })
            })
    })

    test("GET error default status", () => {
        // GIVEN
        let responseError = new Error("ERROR")

        let request = {
            method: "GET",
            query: {
                test: "value"
            }
        }
        let response = new DeepMock()
        response.status.mockReturnValue(response)

        mockValidatorInstance.validate.mockReturnValue({errors: []})
        mockApiInstance.mockThrowValue(responseError)

        // WHEN
        return handler(request, response)
            .then((data) => {
                // THEN
                expect(mockValidatorInstance.validate).toHaveBeenCalledWith(
                    request.query, parameterSchema)

                expect(mockApiInstance).toHaveBeenCalled()

                expect(response.status).toHaveBeenCalledWith(500)
                expect(response.send).toHaveBeenCalledWith({
                    success: false,
                    error: {
                        code: 500,
                        message: "ERROR"
                    }
                })
            })
    })

    test("POST success", () => {
        // GIVEN
        let responseData = {
            "one": "data"
        }
        let request = {
            method: "POST",
            body: {
                test: "value"
            }
        }
        let response = new DeepMock()
        response.status.mockReturnValue(response)

        mockValidatorInstance.validate.mockReturnValue({errors: []})
        mockApiInstance.mockReturnValue(responseData)

        // WHEN
        return handler(request, response)
            .then((data) => {
                // THEN
                expect(mockValidatorInstance.validate).toHaveBeenCalledWith(
                    request.body, parameterSchema)

                expect(mockApiInstance).toHaveBeenCalled()

                expect(response.status).not.toHaveBeenCalled()
                expect(response.send).toHaveBeenCalledWith({
                    success: true,
                    data: responseData
                })
            })
    })
})

describe("Routing::health", () => {
    let handler
    let request, response

    beforeEach(() => {
        Routing.setup(mockService, mockApp, {routing: {}})

        handler = mockApp.use.mock.calls[0][1]

        request = new DeepMock()
        response = new DeepMock()
    })

    test("JSON response", () => {
        // WHEN
        handler(request, response)
        
        // THEN
        expect(response.send).toHaveBeenCalledWith({
            success: true,
            data: {}
        })
    })
})

describe("Routing::notFound", () => {
    let handler
    let request, response

    beforeEach(() => {
        Routing.setup(mockService, mockApp, {routing: {}})

        handler = mockApp.use.mock.calls[2][0]

        request = new DeepMock()
        response = new DeepMock()
        response.type.mockReturnValue(response)
    })

    test("JSON response", () => {
        // GIVEN
        request.accepts.mockReturnValueOnce(true)

        // WHEN
        handler(request, response)
        
        // THEN
        expect(response.status).toHaveBeenCalledWith(404)
        expect(request.accepts).toHaveBeenCalledWith("json")
        expect(response.send).toHaveBeenCalledWith({
            success: false,
            message: "Not found"
        })
    })

    test("Text response", () => {
        // GIVEN
        request.accepts.mockReturnValueOnce(false)

        // WHEN
        handler(request, response)
        
        // THEN
        expect(response.status).toHaveBeenCalledWith(404)
        expect(request.accepts).toHaveBeenCalledWith("json")
        expect(response.type).toHaveBeenCalledWith("txt")
        expect(response.send).toHaveBeenCalledWith("Not found")
    })
})

describe("Routing::authentication", () => {
    beforeEach(() => {
        path.join = jest.fn().mockReturnValueOnce("TEST_LOCATION")

        fs.readdirSync = jest.fn().mockReturnValue([])

        Routing.setup(mockService, mockApp, config = {
            routing: {
                api: {
                    location: "api",
                    path: "/api"
                }
            },
            authentication: {
                login: {
                    api: "login"
                },
                logout: {
                    api: "logout"
                }
            }
        })
    })

    test("Login success redirect", () => {
        // GIVEN
        let handler = mockApp.post.mock.calls[0][2]
        let request = new DeepMock()
        let response = new DeepMock()

        // WHEN
        handler(request, response)

        // THEN
        expect(response.redirect).toHaveBeenCalledWith("/api/login")
    })

    test("Logout", () => {
        // GIVEN
        let handler = mockApp.use.mock.calls[0][1]
        let request = new DeepMock()
        let response = new DeepMock()
        let next = new DeepMock()

        // WHEN
        handler(request, response, next)

        // THEN
        expect(mockService.authentication.logout).toHaveBeenCalledWith(request)
        expect(next).toHaveBeenCalledWith()
    })

    test("Logout success redirect", () => {
        // GIVEN
        let handler = mockApp.post.mock.calls[1][1]
        let request = new DeepMock()
        let response = new DeepMock()

        // WHEN
        handler(request, response)

        // THEN
        expect(response.redirect).toHaveBeenCalledWith("/api/logout")
    })
})
const DeepMock = require("jest-deep-mock")

const {PORT, KEY} = require("../helpers/constants")

jest.mock("path")
jest.mock("express")
jest.mock("body-parser")

jest.mock("../../src/database")
jest.mock("../../src/database")
jest.mock("../../src/dependency")
jest.mock("../../src/logger")
jest.mock("../../src/routing")
jest.mock("../../src/authentication")
jest.mock("../../src/session")


let Service
let express, bodyParser, Database, Dependency, Authentication, Session, routing
let mockApp, mockDatabase, mockJsonParser, mockUrlEncoded


beforeEach(() => {
    Service = require("../../src/service")

    mockApp = new DeepMock()

    mockDatabase = new DeepMock()

    mockJsonParser = new DeepMock()
    mockUrlEncoded = new DeepMock()

    express = require("express")
    express.mockReturnValue(mockApp)

    bodyParser = require("body-parser")
    bodyParser.json = jest.fn(() => {
        return mockJsonParser
    })
    bodyParser.urlencoded = jest.fn(() => {
        return mockUrlEncoded
    })

    Database = require("../../src/database")
    Database.mockReturnValue(mockDatabase)

    Dependency = require("../../src/dependency")

    Authentication = require("../../src/authentication")

    Session = require("../../src/session")

    routing = require("../../src/routing")
    routing.setup = new DeepMock()
})


describe("Service::constructor", () => {
    test("Minimal config", () => {
        // GIVEN
        let config = {
            host: {
                port: PORT
            },
            routing: {
                api: {}
            }
        }

        // WHEN
        let service = new Service(config)

        // THEN
        expect(service.database).not.toBeDefined()

        expect(express).toHaveBeenCalledWith()
        expect(mockApp.use).toHaveBeenCalledWith(mockJsonParser)
        expect(mockApp.use).toHaveBeenCalledWith(mockUrlEncoded)
        expect(routing.setup).toHaveBeenCalledWith(service, mockApp, config)
        expect(Session.setup).toHaveBeenCalledWith(mockApp, config)
        expect(Authentication.setup).toHaveBeenCalledWith(service, mockApp, undefined)
        expect(Database).not.toHaveBeenCalledWith()
    })

    test("Config with database", () => {
        // GIVEN
        let config = {
            host: {
                port: PORT
            },
            routing: {
                api: {}
            },
            database: {
                models: {}
            }
        }

        // WHEN
        let service = new Service(config)

        // THEN
        expect(service.database).toBeDefined()

        expect(express).toHaveBeenCalledWith()
        expect(mockApp.use).toHaveBeenCalledWith(mockJsonParser)
        expect(mockApp.use).toHaveBeenCalledWith(mockUrlEncoded)
        expect(routing.setup).toHaveBeenCalledWith(service, mockApp, config)
        expect(Session.setup).toHaveBeenCalledWith(mockApp, config)
        expect(Authentication.setup).toHaveBeenCalledWith(service, mockApp, undefined)
        expect(Database).toHaveBeenCalledWith(config.database)
    })

    test("Config with dependencies", () => {
        // GIVEN
        let config = {
            host: {
                port: PORT
            },
            routing: {
                api: {}
            },
            dependencies: {
                serviceOne: {
                    name: "service-one"
                },
                serviceTwo: {
                    name: "service-two"
                }
            }
        }

        // WHEN
        let service = new Service(config)

        // THEN
        expect(service.dependencies.serviceOne).toBeDefined()
        expect(service.dependencies.serviceTwo).toBeDefined()

        expect(express).toHaveBeenCalledWith()
        expect(mockApp.use).toHaveBeenCalledWith(mockJsonParser)
        expect(mockApp.use).toHaveBeenCalledWith(mockUrlEncoded)
        expect(routing.setup).toHaveBeenCalledWith(service, mockApp, config)
        expect(Session.setup).toHaveBeenCalledWith(mockApp, config)
        expect(Authentication.setup).toHaveBeenCalledWith(service, mockApp, undefined)
        expect(Dependency).toHaveBeenCalledWith(config.dependencies.serviceOne)
        expect(Dependency).toHaveBeenCalledWith(config.dependencies.serviceTwo)
    })

    test("Config with session", () => {
        // GIVEN
        let config = {
            host: {
                port: PORT
            },
            routing: {
                api: {}
            },
            session: {
                key: KEY
            }
        }

        // WHEN
        let service = new Service(config)

        // THEN
        expect(service.database).not.toBeDefined()

        expect(express).toHaveBeenCalledWith()
        expect(mockApp.use).toHaveBeenCalledWith(mockJsonParser)
        expect(mockApp.use).toHaveBeenCalledWith(mockUrlEncoded)
        expect(routing.setup).toHaveBeenCalledWith(service, mockApp, config)
        expect(Session.setup).toHaveBeenCalledWith(mockApp, config)
        expect(Authentication.setup).toHaveBeenCalledWith(service, mockApp, undefined)
        expect(Database).not.toHaveBeenCalledWith()
    })

    test("Config with authentication", () => {
        // GIVEN
        let config = {
            host: {
                port: PORT
            },
            routing: {
                api: {}
            },
            authentication: {
                login: {}
            }
        }

        // WHEN
        let service = new Service(config)

        // THEN
        expect(service.database).not.toBeDefined()

        expect(express).toHaveBeenCalledWith()
        expect(mockApp.use).toHaveBeenCalledWith(mockJsonParser)
        expect(mockApp.use).toHaveBeenCalledWith(mockUrlEncoded)
        expect(routing.setup).toHaveBeenCalledWith(service, mockApp, config)
        expect(Session.setup).toHaveBeenCalledWith(mockApp, config)
        expect(Authentication.setup).toHaveBeenCalledWith(service, mockApp, config.authentication)
        expect(Database).not.toHaveBeenCalledWith()
    })
})


describe("Service::start", () => {
    let service

    beforeEach(() => {
        service = new Service({
            host: {
                port: PORT
            }
        })
    })

    test("Start service", () => {
        // GIVEN
        mockApp.listen = jest.fn((_, callback) => {
            callback()
        })

        // WHEN
        return service.start()
            .then(() => {
                // THEN
                expect(mockApp.listen).toHaveBeenCalledWith(PORT, expect.any(Function))
            })
    })
})

describe("Service::stop", () => {
    let service

    beforeEach(() => {
        service = new Service({
            host: {
                port: PORT
            }
        })
    })

    test("Stop service", () => {
        // GIVEN
        mockApp.close = jest.fn((callback) => {
            callback()
        })

        // WHEN
        return service.stop()
            .then(() => {
                // THEN
                expect(mockApp.close).toHaveBeenCalledWith(expect.any(Function))
            })
    })
})
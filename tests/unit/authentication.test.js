const DeepMock = require("jest-deep-mock")

const Errors = require("../../src/errors")
const {USER_ID} = require("../helpers/constants")


jest.mock("passport")


let Authentication
let passport
let mockService, mockApp


beforeEach(() => {
    Authentication = require("../../src/authentication")

    passport = require("passport")
    passport.serializeUser = new DeepMock()
    passport.deserializeUser = new DeepMock()
    passport.authenticate = new DeepMock()

    mockService = new DeepMock()
    mockService.authentication = null

    mockApp = new DeepMock()
})


describe("Authentication::setup", () => {
    test("no config", () => {
        // WHEN
        Authentication.setup(mockService, mockApp, null)

        // THEN
        expect(mockService.authentication).toBe(null)

        expect(passport.use).not.toHaveBeenCalled()
        expect(mockApp.use).not.toHaveBeenCalled()
    })

    test("config", () => {
        // GIVEN
        let mockStrategy = new DeepMock()
        let mockStrategyInstance = new DeepMock()
        mockStrategy.mockReturnValue(mockStrategyInstance)

        let config = {
            strategy: mockStrategy
        }

        let mockInit = new DeepMock()
        passport.initialize.mockReturnValue(mockInit)

        let mockSession = new DeepMock()
        passport.session.mockReturnValue(mockSession)

        // WHEN
        Authentication.setup(mockService, mockApp, config)

        // THEN
        expect(mockService.authentication).toBeInstanceOf(Object)

        expect(mockApp.use).toHaveBeenCalledWith(mockInit)
        expect(mockApp.use).toHaveBeenCalledWith(mockSession)

        expect(passport.initialize).toHaveBeenCalledWith()
        expect(passport.session).toHaveBeenCalledWith()

        expect(passport.use).toHaveBeenCalledWith("login", mockStrategyInstance)
        expect(passport.serializeUser).toHaveBeenCalledWith(expect.any(Function))
        expect(passport.deserializeUser).toHaveBeenCalledWith(expect.any(Function))
    })
})


describe("Authentication", () => {
    let authentication
    let mockSerialise, mockSerialiseInstance, mockDeserialise, mockDeserialiseInstance

    beforeEach(() => {
        mockSerialiseInstance = new DeepMock()
        mockDeserialiseInstance = new DeepMock()

        mockSerialise = new DeepMock()
        mockSerialise.mockReturnValue(mockSerialiseInstance)

        mockDeserialise = new DeepMock()
        mockDeserialise.mockReturnValue(mockDeserialiseInstance)

        Authentication.setup(mockService, mockApp, {
            strategy: new DeepMock(),
            serializeUser: mockSerialise,
            deserializeUser: mockDeserialise
        })

        authentication = mockService.authentication
    })

    describe("serialiseUser", () => {
        test("success", () => {
            // GIVEN
            let handler = passport.serializeUser.mock.calls[0][0]
            let user = new DeepMock()
            let callback = new DeepMock()

            mockSerialiseInstance.mockReturnValue(USER_ID)

            // WHEN
            return handler(user, callback)
                .then(() => {
                    // THEN
                    expect(callback).toHaveBeenCalledWith(null, USER_ID)

                    expect(mockSerialise).toHaveBeenCalledWith(mockService)
                    expect(mockSerialiseInstance).toHaveBeenCalledWith(user)
                })
        })

        test("error", () => {
            // GIVEN
            let handler = passport.serializeUser.mock.calls[0][0]
            let user = new DeepMock()
            let callback = new DeepMock()

            let error = new DeepMock()

            mockSerialiseInstance.mockThrowValue(error)

            // WHEN
            return handler(user, callback)
                .then(() => {
                    // THEN
                    expect(callback).toHaveBeenCalledWith(error)
                    
                    expect(mockSerialise).toHaveBeenCalledWith(mockService)
                    expect(mockSerialiseInstance).toHaveBeenCalledWith(user)
                })
        })
    })

    describe("deserialiseUser", () => {
        test("success", () => {
            // GIVEN
            let handler = passport.deserializeUser.mock.calls[0][0]
            let user = new DeepMock()
            let callback = new DeepMock()

            mockDeserialiseInstance.mockReturnValue(user)

            // WHEN
            return handler(USER_ID, callback)
                .then(() => {
                    // THEN
                    expect(callback).toHaveBeenCalledWith(null, user)

                    expect(mockDeserialise).toHaveBeenCalledWith(mockService)
                    expect(mockDeserialiseInstance).toHaveBeenCalledWith(USER_ID)
                })
        })

        test("error", () => {
            // GIVEN
            let handler = passport.deserializeUser.mock.calls[0][0]
            let user = new DeepMock()
            let callback = new DeepMock()

            let error = new DeepMock()

            mockDeserialiseInstance.mockThrowValue(error)

            // WHEN
            return handler(USER_ID, callback)
                .then(() => {
                    // THEN
                    expect(callback).toHaveBeenCalledWith(error)
                    
                    expect(mockDeserialise).toHaveBeenCalledWith(mockService)
                    expect(mockDeserialiseInstance).toHaveBeenCalledWith(USER_ID)
                })
        })
    })

    describe("validateUser", () => {
        test("valid user", () => {
            // GIVEN
            let request = new DeepMock()
            request.isAuthenticated.mockReturnValue(true)

            // WHEN
            authentication.validateUser(request)
        })

        test("invalid user", () => {
            // GIVEN
            let request = new DeepMock()
            request.isAuthenticated.mockReturnValue(false)

            let call = () => {
                authentication.validateUser(request)
            }

            // WHEN
            expect(call).toThrow(Errors.Unauthorised)
        })
    })

    describe("authenticate", () => {
        test("success", () => {
            // GIVEN
            let mockAuth = new DeepMock()
            passport.authenticate.mockReturnValue(mockAuth)

            // WHEN
            let actual = authentication.authenticate()

            // THEN
            expect(actual).toBe(mockAuth)

            expect(passport.authenticate).toHaveBeenCalledWith("login")
        })
    })

    describe("logout", () => {
        test("requires logout", () => {
            // GIVEN
            let request = new DeepMock()
            request.isAuthenticated.mockReturnValue(true)

            // WHEN
            authentication.logout(request)

            // THEN
            expect(request.logout).toHaveBeenCalledWith()
        })

        test("already logged out", () => {
            // GIVEN
            let request = new DeepMock()
            request.isAuthenticated.mockReturnValue(false)

            // WHEN
            authentication.logout(request)

            // THEN
            expect(request.logout).not.toHaveBeenCalledWith()
        })
    })
})
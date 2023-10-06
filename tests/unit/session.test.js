const DeepMock = require("jest-deep-mock")

const {KEY, SECRET, HOST, PORT, USER, PASSWORD, DATABASE} = require("../helpers/constants")


jest.mock("express-session")
jest.mock("express-mysql-session")


let Session
let session, SessionStore
let mockApp


beforeEach(() => {
    Session = require("../../src/session")

    session = require("express-session")
    SessionStore = require("express-mysql-session")

    mockService = new DeepMock()
    mockApp = new DeepMock()
})

describe("Session::setup", () => {
    test("no session config", () => {
        // GIVEN
        let config = {}

        // WHEN
        Session.setup(mockApp, config)

        // THEN
        expect(mockApp.use).not.toHaveBeenCalled()
    })

    test("no database config", () => {
        // GIVEN
        let config = {
            session: {
                key: KEY,
                secret: SECRET,
                database: DATABASE
            }
        }

        // WHEN
        Session.setup(mockApp, config)

        // THEN
        expect(mockApp.use).not.toHaveBeenCalled()
    })

    test("no database config", () => {
        // GIVEN
        let config = {
            session: {
                key: KEY,
                secret: SECRET,
                database: DATABASE
            },
            database: {
                connection: {
                    host: HOST,
                    user: USER,
                    password: PASSWORD,
                    database: DATABASE
                }
            }
        }

        let mockSession = new DeepMock()
        session.mockReturnValue(mockSession)

        let mockStore = new DeepMock()
        SessionStore.mockReturnValue(mockStore)

        // WHEN
        Session.setup(mockApp, config)

        // THEN
        expect(mockApp.use).toHaveBeenCalledWith(mockSession)

        expect(SessionStore).toHaveBeenCalledWith({
            host: HOST,
            user: USER,
            password: PASSWORD,
            database: DATABASE
        })
        expect(session).toHaveBeenCalledWith({
            key: KEY, 
            secret: SECRET,
            resave: true,
            saveUninitialized: true,
            store: mockStore,
            cookie: {
                maxAge: 30 * 24 * 3600000
            }
        })
    })
})

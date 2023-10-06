let Errors

beforeEach(() => {
    Errors = require("../../src/errors")
})

describe("Errors::ExtendableError", () => {
    test("Constructor", () => {
        // WHEN
        let error = new Errors.ExtendableError("ERROR")

        // THEN
        expect(error.name).toBe("ExtendableError")
        expect(error.message).toBe("ERROR")
    })

    test("No captureStackTrace", () => {
        // GIVE
        Error.captureStackTrace = undefined

        // WHEN
        let error = new Errors.ExtendableError("ERROR")

        // THEN
        expect(error.name).toBe("ExtendableError")
        expect(error.message).toBe("ERROR")
    })
})

describe("Errors::ControllerError", () => {
    test("Constructor", () => {
        // WHEN
        let error = new Errors.ControllerError("ERROR", 123, 456)

        // THEN
        expect(error.name).toBe("ControllerError")
        expect(error.message).toBe("ERROR")
        expect(error.code).toBe(123)
        expect(error.status).toBe(456)
    })

    test("Use default", () => {
        // WHEN
        let error = new Errors.ControllerError("ERROR")

        // THEN
        expect(error.name).toBe("ControllerError")
        expect(error.message).toBe("ERROR")
        expect(error.code).toBe(500)
        expect(error.status).toBe(500)
    })
})

describe("Errors::BadRequest", () => {
    test("Constructor", () => {
        // WHEN
        let error = new Errors.BadRequest("ERROR")

        // THEN
        expect(error.name).toBe("BadRequest")
        expect(error.message).toBe("ERROR")
        expect(error.code).toBe(400)
        expect(error.status).toBe(400)
    })
})

describe("Errors::NotFound", () => {
    test("Constructor", () => {
        // WHEN
        let error = new Errors.NotFound("ERROR")

        // THEN
        expect(error.name).toBe("NotFound")
        expect(error.message).toBe("ERROR")
        expect(error.code).toBe(404)
        expect(error.status).toBe(404)
    })
})

describe("Errors::Unauthorized", () => {
    test("Constructor", () => {
        // WHEN
        let error = new Errors.Unauthorized("ERROR")

        // THEN
        expect(error.name).toBe("Unauthorized")
        expect(error.message).toBe("ERROR")
        expect(error.code).toBe(401)
        expect(error.status).toBe(401)
    })
})

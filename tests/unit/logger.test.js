const DeepMock = require("jest-deep-mock")


let logger
let stdoutWrite, date

beforeEach(() => {
    logger = require("../../src/logger")

    stdoutWrite = process.stdout.write
    date = Date

    let dateInstance = new DeepMock()
    dateInstance.toString = new DeepMock()
    dateInstance.mockReturnValue("TEST DATE")
    dateInstance.toISOString.mockReturnValue("TEST DATE")

    process.stdout.write = new DeepMock()
    Date = new DeepMock()
    Date.mockReturnValue(dateInstance)
})

afterEach(() => {
    process.stdout.write = stdoutWrite
    Date = date
})

describe("Logger", () => {
    test("no metadata", () => {
        // WHEN
        logger.info("Test log message")

        // THEN
        expect(process.stdout.write).toHaveBeenCalledWith("TEST DATE - info: Test log message\n")
    })

    test("no blacklisted metadata", () => {
        // WHEN
        logger.info("Test log message", {
            test: "value"
        })

        // THEN
        expect(process.stdout.write).toHaveBeenCalledWith("TEST DATE - info: Test log message test=value\n")
    })

    test("blacklisted metadata", () => {
        // WHEN
        logger.info("Test log message", {
            password: "value"
        })

        // THEN
        expect(process.stdout.write).toHaveBeenCalledWith("TEST DATE - info: Test log message password=******\n")
    })

    test("nested blacklisted metadata", () => {
        // WHEN
        logger.info("Test log message", {
            test: {
                password: "value"
            }
        })

        // THEN
        expect(process.stdout.write).toHaveBeenCalledWith("TEST DATE - info: Test log message password=******\n")
    })

    test("array of blacklisted metadata", () => {
        // WHEN
        logger.info("Test log message", {
            test: [
                {password: "value"}
            ]
        })

        // THEN
        expect(process.stdout.write).toHaveBeenCalledWith("TEST DATE - info: Test log message test=[password=******]\n")
    })
})

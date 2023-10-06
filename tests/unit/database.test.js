const {HOST, PORT, USER, PASSWORD, DATABASE, CONNECTION_LIMIT} = require("../helpers/constants")


jest.mock("fs")
jest.mock("path")
jest.mock("mysql")

jest.mock("../../src/moduleloader")
jest.mock("../../src/logger")


let Database
let mysql, ModuleLoader
let mockPool, mockLoader
let config


beforeEach(() => {
    Database = require("../../src/database")

    mockPool = jest.fn()

    mysql = require("mysql")
    mysql.createPool = jest.fn().mockReturnValue(mockPool)

    ModuleLoader = require("../../src/moduleloader")
    ModuleLoader.load = jest.fn()

    process.cwd = jest.fn()

    config = {
        connection: {
            host: HOST,
            user: USER,
            password: PASSWORD,
            database: DATABASE,
            connectionLimit: CONNECTION_LIMIT
        }
    }
})


describe("Database::constructor", () => {
    test("No models", () => {
        // WHEN
        let database = new Database(config)

        // THEN
        expect(database.models).toEqual({})

        expect(mysql.createPool).toHaveBeenCalledWith({
            host: HOST,
            user: USER,
            password: PASSWORD,
            database: DATABASE,
            connectionLimit: CONNECTION_LIMIT,
            queryFormat: expect.any(Function)
        })
    })

    test("Default values", () => {
        // WHEN
        config.connection.connectionLimit = null

        let database = new Database(config)

        // THEN
        expect(database.models).toEqual({})

        expect(mysql.createPool).toHaveBeenCalledWith({
            host: HOST,
            user: USER,
            password: PASSWORD,
            database: DATABASE,
            connectionLimit: 10,
            queryFormat: expect.any(Function)
        })
    })

    test("Contains models", () => {
        // GIVEN
        config.models = {
            location: "TEST_LOCATION"
        }

        let fs = require("fs")
        fs.readdirSync = jest.fn().mockReturnValue([
            "model_one.js", "model_two.js"])

        let path = require("path")
        path.join = jest.fn()
            .mockReturnValueOnce("TEST_CWD/TEST_LOCATION")
            .mockReturnValueOnce("TEST_LOCATION/model_one.js")
            .mockReturnValueOnce("TEST_LOCATION/model_two.js")
       
        let mockModelOne = jest.fn()
        let mockModelTwo = jest.fn()

        let mockModelOneModule = jest.fn().mockReturnValue(mockModelOne)
        let mockModelTwoModule = jest.fn().mockReturnValue(mockModelTwo)

        ModuleLoader.load
            .mockReturnValueOnce(mockModelOneModule)
            .mockReturnValueOnce(mockModelTwoModule)

        // WHEN
        let database = new Database(config)

        // THEN
        expect(database.models).toEqual({
            model_one: mockModelOne,
            model_two: mockModelTwo
        })

        expect(mysql.createPool).toHaveBeenCalledWith({
            host: HOST,
            user: USER,
            password: PASSWORD,
            database: DATABASE,
            connectionLimit: CONNECTION_LIMIT,
            queryFormat: expect.any(Function)
        })

        expect(fs.readdirSync).toHaveBeenCalledWith("TEST_CWD/TEST_LOCATION")

        expect(ModuleLoader.load).toHaveBeenCalledWith("TEST_LOCATION/model_one.js")
        expect(ModuleLoader.load).toHaveBeenCalledWith("TEST_LOCATION/model_two.js")

        expect(mockModelOneModule).toHaveBeenCalledWith(database)
        expect(mockModelTwoModule).toHaveBeenCalledWith(database)
    })
})

describe("Database::query", () => {
    let sql, parameters
    let database

    beforeEach(() => {
        sql = "SELECT * FROM test"
        parameters = {
            test: "value"
        }

        database = new Database(config)
    })

    test("Connection error", () => {
        // GIVEN
        let error = new Error("CONN_ERR")

        mockPool.getConnection = jest.fn((callback) => {
            callback(error, null)
        })

        // WHEN
        return database.query(sql, parameters)
            .catch((data) => {
                // THEN
                expect(data).toBeInstanceOf(Database.DatabaseError)
                expect(data.code).toBe(500)
                expect(data.message).toBe("Error getting database connection: CONN_ERR")

                expect(mockPool.getConnection).toHaveBeenCalledWith(expect.any(Function))
            })
    })

    test("Query error", () => {
        // GIVEN
        let error = new Error("QUERY_ERR")

        let mockConnection = jest.fn()
        mockConnection.query = jest.fn((sql, parameters, callback) => {
            callback(error, null)
        })
        mockConnection.release = jest.fn()

        mockPool.getConnection = jest.fn((callback) => {
            callback(null, mockConnection)
        })

        // WHEN
        return database.query(sql, parameters)
            .catch((data) => {
                // THEN
                expect(data).toBeInstanceOf(Database.DatabaseError)
                expect(data.code).toBe(500)
                expect(data.message).toBe("Error querying database: QUERY_ERR")

                expect(mockPool.getConnection).toHaveBeenCalledWith(expect.any(Function))
                expect(mockConnection.query).toHaveBeenCalledWith(sql, parameters, expect.any(Function))
                expect(mockConnection.release).toHaveBeenCalledWith()
            })
    })

    test("Map query error code", () => {
        // GIVEN
        let error = new Error("QUERY_ERR")
        error.errno = 1062

        let mockConnection = jest.fn()
        mockConnection.query = jest.fn((sql, parameters, callback) => {
            callback(error, null)
        })
        mockConnection.release = jest.fn()

        mockPool.getConnection = jest.fn((callback) => {
            callback(null, mockConnection)
        })

        // WHEN
        return database.query(sql, parameters)
            .catch((data) => {
                // THEN
                expect(data).toBeInstanceOf(Database.DatabaseError)
                expect(data.code).toBe(409)
                expect(data.message).toBe("Error querying database: QUERY_ERR")

                expect(mockPool.getConnection).toHaveBeenCalledWith(expect.any(Function))
                expect(mockConnection.query).toHaveBeenCalledWith(sql, parameters, expect.any(Function))
                expect(mockConnection.release).toHaveBeenCalledWith()
            })
    })

    test("Successful query", () => {
        // GIVEN
        let error = new Error("QUERY_ERR")

        let results = [{test: "value"}]

        let mockConnection = jest.fn()
        mockConnection.query = jest.fn((sql, parameters, callback) => {
            callback(null, results)
        })
        mockConnection.release = jest.fn()

        mockPool.getConnection = jest.fn((callback) => {
            callback(null, mockConnection)
        })

        // WHEN
        return database.query(sql, parameters)
            .then((data) => {
                // THEN
                expect(data).toBe(results)

                expect(mockPool.getConnection).toHaveBeenCalledWith(expect.any(Function))
                expect(mockConnection.query).toHaveBeenCalledWith(sql, parameters, expect.any(Function))
                expect(mockConnection.release).toHaveBeenCalledWith()
            })
    })

    test("Default parameters", () => {
        // GIVEN
        let error = new Error("QUERY_ERR")

        let results = [{test: "value"}]

        let mockConnection = jest.fn()
        mockConnection.query = jest.fn((sql, parameters, callback) => {
            callback(null, results)
        })
        mockConnection.release = jest.fn()

        mockPool.getConnection = jest.fn((callback) => {
            callback(null, mockConnection)
        })

        // WHEN
        return database.query(sql, null)
            .then((data) => {
                // THEN
                expect(data).toBe(results)

                expect(mockPool.getConnection).toHaveBeenCalledWith(expect.any(Function))
                expect(mockConnection.query).toHaveBeenCalledWith(sql, {}, expect.any(Function))
                expect(mockConnection.release).toHaveBeenCalledWith()
            })
    })
})

describe("Database::queryFormat", () => {
    beforeEach(() => {
        mysql.escape = jest.fn((value) => {
            return `'${value}'`
        })
    })

    test("No parameters", () => {
        // GIVEN
        let query = "SELECT * FROM test"
        let values = {}

        let expected = query

        // WHEN
        let actual = Database.queryFormat(query, values)

        // THEN
        expect(actual).toBe(expected)
    })

    test("Single parameter", () => {
        // GIVEN
        let query = "SELECT * FROM test WHERE column = @test"
        let values = {
            test: "value"
        }

        let expected = "SELECT * FROM test WHERE column = 'value'"

        // WHEN
        let actual = Database.queryFormat(query, values)

        // THEN
        expect(actual).toBe(expected)
    })

    test("Empty string value", () => {
        // GIVEN
        let query = "SELECT * FROM test WHERE column = @test"
        let values = {
            test: ""
        }

        let expected = "SELECT * FROM test WHERE column = ''"

        // WHEN
        let actual = Database.queryFormat(query, values)

        // THEN
        expect(actual).toBe(expected)
    })

    test("Parameter not found", () => {
        // GIVEN
        let query = "SELECT * FROM test WHERE column = @test"
        let values = {}

        let expected = query

        // WHEN
        let actual = Database.queryFormat(query, values)

        // THEN
        expect(actual).toBe(expected)
    })

    test("Multiple matches", () => {
        // GIVEN
        let query = "SELECT * FROM test WHERE column = @test or column = @test"
        let values = {
            test: "value"
        }

        let expected = "SELECT * FROM test WHERE column = 'value' or column = 'value'"

        // WHEN
        let actual = Database.queryFormat(query, values)

        // THEN
        expect(actual).toBe(expected)
    })

    test("Multiple parameters", () => {
        // GIVEN
        let query = "SELECT * FROM test WHERE column = @test or column = @key"
        let values = {
            test: "value",
            key: "data"
        }

        let expected = "SELECT * FROM test WHERE column = 'value' or column = 'data'"

        // WHEN
        let actual = Database.queryFormat(query, values)

        // THEN
        expect(actual).toBe(expected)
    })

    test("Empty query", () => {
        // GIVEN
        let query = ""
        let values = {}

        let expected = query

        // WHEN
        let actual = Database.queryFormat(query, values)

        // THEN
        expect(actual).toBe(expected)
    })

    test("No parameters", () => {
        // GIVEN
        let query = "SELECT * FROM test"
        let values = null

        let expected = query

        // WHEN
        let actual = Database.queryFormat(query, values)

        // THEN
        expect(actual).toBe(expected)
    })
})
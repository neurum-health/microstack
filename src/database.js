const fs = require("fs")
const path = require("path")
const mysql = require("mysql")
const HttpStatus = require('http-status-codes')

const Errors = require("./errors")
const ModuleLoader = require("./moduleloader")


const MYSQL_ERROR_CODES = {
    1062: HttpStatus.CONFLICT
}


class DatabaseError extends Errors.ControllerError {
    constructor(message, code) {
        super(message, code, code)
    }
}


function queryFormat(query, values) {
    if(!values)
    {
        return query
    }

    return query.replace(/@(\w+)/g, (match, key) => {
        if(values.hasOwnProperty(key))
        {
            return mysql.escape(values[key])
        }

        return match
    })
}


function typeCast(field, useDefaultTypeCasting) {
    if((field.type === "TINY") && field.length === 1)
    {
        return field.string() === "1"
    }

    return useDefaultTypeCasting()
}


function createPool(config) {
    return mysql.createPool({
        connectionLimit: config.connection.connectionLimit || 10,
        host: config.connection.host,
        user: config.connection.user,
        password: config.connection.password,
        database: config.connection.database,
	charset: config.connection.charset,
        queryFormat: queryFormat,
        typeCast: typeCast
    })
}


function loadModels(database, config) {
    if(!config || !config.location)
    {
        return {}
    }

    const models = {}
    const directory = path.join(process.cwd(), config.location)

    for(const filename of fs.readdirSync(directory))
    {
        const filepath = path.join(directory, filename)
        const modelName = filename.substring(0, filename.length - 3)

        models[modelName] = ModuleLoader.load(filepath)(database)
    }

    return models
}


function Database(config) {
    const pool = createPool(config)

    this.models = loadModels(this, config.models)

    this.query = (sql, parameters) => {
        parameters = parameters || {}

        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if(err)
                {
                    return reject(new DatabaseError(`Error getting database connection: ${err.message}`))
                }

                connection.query(sql, parameters, (err, res) => {
                    connection.release()

                    if(err)
                    {
                        let code = MYSQL_ERROR_CODES[err.errno]
                        return reject(new DatabaseError(`Error querying database: ${err.message}`, code))
                    }

                    resolve(res)
                })
            })
        })
    }
    this.DatabaseError = DatabaseError;
}


module.exports = Database
module.exports.DatabaseError = DatabaseError
module.exports.queryFormat = queryFormat

const HttpStatus = require('http-status-codes')


class ExtendableError extends Error {
    constructor(message) {
        super(message)
 
        this.name = this.constructor.name
        this.message = message
 
        if(typeof Error.captureStackTrace === "function")
        {
            Error.captureStackTrace(this, this.constructor)
        }
        else
        { 
            this.stack = (new Error(message)).stack;
        }
    }
}    


class ControllerError extends ExtendableError {
    constructor(message, code, status, data) {
        super(message)
 
        this.code = code || HttpStatus.INTERNAL_SERVER_ERROR
        this.status = status || HttpStatus.INTERNAL_SERVER_ERROR
        this.data = data
    }
}

class Forbidden extends ControllerError {
    constructor(message, data) {
        super(message, HttpStatus.FORBIDDEN, HttpStatus.FORBIDDEN, data)
    }
}

class Conflict extends ControllerError {
    constructor(message, data) {
        super(message, HttpStatus.CONFLICT, HttpStatus.CONFLICT, data)
    }
}

class UnsupportedMediaType extends ControllerError {
    constructor(message, data) {
        super(message, HttpStatus.UNSUPPORTED_MEDIA_TYPE, HttpStatus.UNSUPPORTED_MEDIA_TYPE, data)
    }
}

class BadRequest extends ControllerError {
    constructor(message, data) {
        super(message, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST, data)
    }
}


class NotFound extends ControllerError {
    constructor(message, data) {
        super(message, HttpStatus.NOT_FOUND, HttpStatus.NOT_FOUND, data)
    }
}


class Unauthorized extends ControllerError {
    constructor(message, data) {
        super(message, HttpStatus.UNAUTHORIZED, HttpStatus.UNAUTHORIZED, data)
    }
}


class NoContent extends ControllerError {
    constructor(message, data) {
        super(message, HttpStatus.NO_CONTENT, HttpStatus.NO_CONTENT, data)
    }
}


module.exports = {
    ExtendableError: ExtendableError,
    ControllerError: ControllerError,
    BadRequest: BadRequest,
    NotFound: NotFound,
    Unauthorized: Unauthorized,
    NoContent: NoContent,
    Forbidden: Forbidden,
    Conflict: Conflict,
    UnsupportedMediaType: UnsupportedMediaType
}

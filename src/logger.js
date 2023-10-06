const winston = require("winston")


const BLACKLISTED_PROPERTIES = ["password", "currentPassword", "newPassword"]


function applyBlacklist(obj) {
    if(obj instanceof Array)
    {
        return obj.map((item) => {
            return applyBlacklist(item)
        })
    }
    else if(typeof obj === "object")
    {
        let result = {}
        
        for(let key in obj)
        {
            let value = obj[key]
            if(value && BLACKLISTED_PROPERTIES.includes(key))
            {
                result[key] = "******"
            }
            else if(value instanceof Buffer)
            {
                result[key] = "[Buffer]"
            }
            else
            {
                result[key] = applyBlacklist(value)
            }
        }

        return result
    }

    return obj
}


const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            timestamp: true
        })
    ],
    rewriters: [
        (level, msg, meta) => {
            return applyBlacklist(meta)
        }
    ]
})


module.exports = logger

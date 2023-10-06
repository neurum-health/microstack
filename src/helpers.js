const qs = require("qs")


module.exports.parseQueryString = (str) => {
    let params = qs.parse(str, {
        allowPrototypes: true,
        parseArrays: true
    })

    for(let key in params)
    {
        const value = params[key]
        
        if(typeof value === "object")
        {
            params[key] = Object.values(value)
        }
    }

    return params
}

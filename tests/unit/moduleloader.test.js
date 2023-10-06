let ModuleLoader

beforeEach(() => {
    ModuleLoader = require("../../src/moduleloader")
})

describe("ModuleLoader::load", () => {
    test("Success", () => {
        // GIVEN
        let expected = require("jest")

        // WHEN
        let actual = ModuleLoader.load("jest")

        // THEN
        expect(actual).toBe(expected)
    })
})
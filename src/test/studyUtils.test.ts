import { getStringInfo, toUpperCase } from "../Utils";
describe("Utils test suite", () => {
  it("should return uppercase", () => {
    //arrange:
    const sut = toUpperCase;
    const expected = "ABC";

    //act
    const result = sut("abc");

    //assert:
    expect(result).toBe(expected);
  });

  it("should return info for valid string", () => {
    const actual = getStringInfo("My-string");

    expect(actual.lowerCase).toBe("my=string");
  });
});

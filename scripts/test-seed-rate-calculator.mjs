import test from "node:test";
import assert from "node:assert/strict";
import { calculateRequiredQuantity, convertAreaToAcres } from "../lib/calculators/quantity.mjs";

test("Seed Rate Calculator: area-unit conversions", () => {
  assert.equal(convertAreaToAcres(1, "acre"), 1);
  assert.equal(convertAreaToAcres(1, "hectare"), 2.47105);
  assert.equal(convertAreaToAcres(100, "decimal"), 1);
  assert.equal(convertAreaToAcres(50, "decimal"), 0.5);
});

test("Seed Rate Calculator: quantity formula uses kg per acre", () => {
  assert.equal(calculateRequiredQuantity(0.5, "acre", 8), 4);
  assert.equal(calculateRequiredQuantity(1, "hectare", 8), 19.7684);
  assert.equal(calculateRequiredQuantity(50, "decimal", 8), 4);
});

test("Seed Rate Calculator: empty, zero, negative and invalid values are safe", () => {
  for (const value of ["", 0, -1, "not-a-number", Infinity, NaN]) {
    assert.equal(calculateRequiredQuantity(value, "acre", 8), 0);
    assert.equal(calculateRequiredQuantity(1, "acre", value), 0);
  }
});

test("Seed Rate Calculator: unsupported area unit fails loudly", () => {
  assert.throws(() => convertAreaToAcres(1, "bigha"), RangeError);
});

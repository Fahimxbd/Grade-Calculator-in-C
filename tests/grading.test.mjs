import test from "node:test";
import assert from "node:assert/strict";
import { calculate, getExam, gradeFromPercent, exampleSubjects } from "../web/grading.mjs";

const sub = (marks, extra = {}) => ({ name: "Subject", marks, full: 100, credits: 3, ...extra });

test("all education levels have valid starter subjects", () => {
  for (const id of ["psc", "jsc", "ssc", "hsc", "dakhil", "alim", "honours", "degree", "masters"]) {
    assert.ok(exampleSubjects(id).length >= 4);
    assert.equal(getExam(id).id, id);
  }
});

test("board boundary marks use the Bangladesh 5-point scheme", () => {
  for (const [mark, letter, point] of [
    [0, "F", 0], [32.99, "F", 0], [33, "D", 1], [39.99, "D", 1],
    [40, "C", 2], [50, "B", 3], [60, "A-", 3.5], [70, "A", 4],
    [79.99, "A", 4], [80, "A+", 5], [100, "A+", 5]
  ]) {
    assert.deepEqual({ letter: gradeFromPercent(mark, "board").letter, point: gradeFromPercent(mark, "board").point }, { letter, point });
  }
});

test("higher education 4-point cutoffs", () => {
  for (const [mark, letter, point] of [
    [39.99, "F", 0], [40, "D", 2], [45, "C", 2.25], [50, "C+", 2.5],
    [55, "B-", 2.75], [60, "B", 3], [65, "B+", 3.25], [70, "A-", 3.5],
    [75, "A", 3.75], [80, "A+", 4]
  ]) {
    const result = gradeFromPercent(mark, "university");
    assert.equal(result.letter, letter);
    assert.equal(result.point, point);
  }
});

test("the fourth-subject bonus is added without increasing the divisor", () => {
  const result = calculate("ssc", [sub(70), sub(70), sub(70), sub(70), sub(80, { optional: true })]);
  assert.equal(result.bonus, 3);
  assert.equal(result.gpa, 4.75);
  assert.equal(result.requiredCount, 4);
});

test("optional subject never lowers GPA and GPA never exceeds 5", () => {
  assert.equal(calculate("hsc", [sub(80), sub(80), sub(20, { optional: true })]).gpa, 5);
  assert.equal(calculate("hsc", [sub(80), sub(80), sub(90, { optional: true })]).gpa, 5);
});

test("failure in any required board subject fails the result even with optional bonus", () => {
  const result = calculate("ssc", [sub(90), sub(32), sub(100, { optional: true })]);
  assert.equal(result.status, "Fail");
  assert.equal(result.gpa, 0);
});

test("credit-weighted university GPA includes failed credit attempts", () => {
  const result = calculate("honours", [sub(80, { credits: 3 }), sub(60, { credits: 1 }), sub(20, { credits: 2 })]);
  assert.equal(result.gpa, (4 * 3 + 3 * 1) / 6);
  assert.equal(result.totalCredits, 6);
  assert.equal(result.failed, true);
});

test("marks are converted to percent from their full marks", () => {
  const result = calculate("jsc", [sub(60, { full: 75 })]);
  assert.equal(result.subjects[0].letter, "A+");
});

test("invalid, missing and inappropriate optional inputs are rejected", () => {
  assert.throws(() => calculate("ssc", [sub("")]), /required/);
  assert.throws(() => calculate("ssc", [sub(-1)]), /Obtained marks/);
  assert.throws(() => calculate("ssc", [sub(101)]), /Obtained marks/);
  assert.throws(() => calculate("honours", [sub(60, { credits: 0 })]), /Credits/);
  assert.throws(() => calculate("jsc", [sub(80, { optional: true })]), /not supported/);
  assert.throws(() => calculate("ssc", [sub(80, { optional: true }), sub(70, { optional: true })]), /Only one/);
  assert.throws(() => calculate("ssc", [sub(80, { optional: true })]), /compulsory/);
  assert.throws(() => gradeFromPercent(NaN, "board"), /Percentage/);
});

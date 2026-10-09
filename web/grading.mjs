/**
 * Bangladesh GPA and university-style credit-weighted CGPA.
 * Pure module, shared by the browser UI and Node.js tests.
 * This is an estimator, not an official examination result.
 */
export const EXAMS = Object.freeze([
  { id: "psc", label: "PSC / PECE", category: "board", legacy: true, optional: false },
  { id: "jsc", label: "JSC / JDC", category: "board", legacy: true, optional: false },
  { id: "ssc", label: "SSC", category: "board", optional: true },
  { id: "hsc", label: "HSC", category: "board", optional: true },
  { id: "dakhil", label: "Dakhil", category: "board", optional: true },
  { id: "alim", label: "Alim", category: "board", optional: true },
  { id: "honours", label: "Honours", category: "university", optional: false },
  { id: "degree", label: "Degree", category: "university", optional: false },
  { id: "masters", label: "Masters", category: "university", optional: false }
]);

export const BOARD_SCALE = Object.freeze([
  { minimum: 80, letter: "A+", point: 5 },
  { minimum: 70, letter: "A", point: 4 },
  { minimum: 60, letter: "A-", point: 3.5 },
  { minimum: 50, letter: "B", point: 3 },
  { minimum: 40, letter: "C", point: 2 },
  { minimum: 33, letter: "D", point: 1 },
  { minimum: 0, letter: "F", point: 0 }
]);

export const UNIVERSITY_SCALE = Object.freeze([
  { minimum: 80, letter: "A+", point: 4 },
  { minimum: 75, letter: "A", point: 3.75 },
  { minimum: 70, letter: "A-", point: 3.5 },
  { minimum: 65, letter: "B+", point: 3.25 },
  { minimum: 60, letter: "B", point: 3 },
  { minimum: 55, letter: "B-", point: 2.75 },
  { minimum: 50, letter: "C+", point: 2.5 },
  { minimum: 45, letter: "C", point: 2.25 },
  { minimum: 40, letter: "D", point: 2 },
  { minimum: 0, letter: "F", point: 0 }
]);

export function getExam(id) {
  const exam = EXAMS.find((item) => item.id === id);
  if (!exam) throw new RangeError("Unknown examination type.");
  return exam;
}

export function gradeFromPercent(percentage, category) {
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new RangeError("Percentage must be between 0 and 100.");
  }
  const scale = category === "university" ? UNIVERSITY_SCALE : category === "board" ? BOARD_SCALE : null;
  if (!scale) throw new RangeError("Unknown grading scale.");
  return scale.find((item) => percentage >= item.minimum);
}

function checkedNumber(value, name, min, max, allowZero = false) {
  if (value === "" || value === null || value === undefined) {
    throw new RangeError(name + " is required.");
  }
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (!allowZero && number === 0)) {
    throw new RangeError(name + " must be between " + min + " and " + max + ".");
  }
  return number;
}

export function calculate(examId, subjects) {
  const exam = getExam(examId);
  if (!Array.isArray(subjects) || subjects.length < 1 || subjects.length > 40) {
    throw new RangeError("Add between 1 and 40 subjects.");
  }
  let optionalCount = 0;
  const graded = subjects.map((subject, index) => {
    if (!subject || typeof subject !== "object") throw new TypeError("Invalid subject.");
    const name = String(subject.name || "").trim() || "Subject " + (index + 1);
    const full = checkedNumber(subject.full, "Full marks", 1, 1000);
    const marks = checkedNumber(subject.marks, "Obtained marks", 0, full, true);
    const optional = exam.optional && subject.optional === true;
    if (subject.optional === true && !exam.optional) {
      throw new RangeError("Fourth-subject bonus is not supported for this exam.");
    }
    if (optional) optionalCount++;
    const credits = exam.category === "university"
      ? checkedNumber(subject.credits, "Credits", 0.01, 30)
      : 1;
    const percentage = (marks / full) * 100;
    const grade = gradeFromPercent(percentage, exam.category);
    return { name, marks, full, credits, optional, percentage, letter: grade.letter, point: grade.point };
  });
  if (optionalCount > 1) throw new RangeError("Only one optional subject is supported.");
  const required = graded.filter((subject) => !subject.optional);
  if (required.length === 0) throw new RangeError("Add at least one compulsory subject.");
  const failed = required.some((subject) => subject.letter === "F");
  const optionalSubject = graded.find((subject) => subject.optional);
  const totalMarks = required.reduce((sum, subject) => sum + subject.marks, 0);
  const totalFull = required.reduce((sum, subject) => sum + subject.full, 0);
  if (exam.category === "board") {
    const bonus = optionalSubject ? Math.max(0, optionalSubject.point - 2) : 0;
    const points = required.reduce((sum, subject) => sum + subject.point, 0);
    const gpa = failed ? 0 : Math.min(5, (points + bonus) / required.length);
    return { exam, subjects: graded, requiredCount: required.length, failed, status: failed ? "Fail" : "Pass",
      gpa, maximum: 5, bonus, totalMarks, totalFull, percentage: (totalMarks / totalFull) * 100 };
  }
  const totalCredits = required.reduce((sum, subject) => sum + subject.credits, 0);
  const weightedPoints = required.reduce((sum, subject) => sum + subject.point * subject.credits, 0);
  return { exam, subjects: graded, requiredCount: required.length, failed, status: failed ? "Has failed course" : "All courses passed",
    gpa: weightedPoints / totalCredits, maximum: 4, bonus: 0, totalCredits,
    totalMarks, totalFull, percentage: (totalMarks / totalFull) * 100 };
}

export function exampleSubjects(examId) {
  const exam = getExam(examId);
  const defaults = {
    psc: ["Bangla", "English", "Mathematics", "Science", "Social Studies", "Religion"],
    jsc: ["Bangla", "English", "Mathematics", "Science", "Social Studies", "ICT"],
    ssc: ["Bangla", "English", "Mathematics", "Physics", "Chemistry", "ICT", "Biology"],
    hsc: ["Bangla", "English", "ICT", "Physics", "Chemistry", "Higher Mathematics", "Biology"],
    dakhil: ["Quran", "Hadith", "Arabic", "Bangla", "English", "Mathematics", "Science"],
    alim: ["Quran", "Hadith", "Arabic", "Bangla", "English", "ICT", "Islamic History"],
    honours: ["Course 1", "Course 2", "Course 3", "Course 4"],
    degree: ["Course 1", "Course 2", "Course 3", "Course 4"],
    masters: ["Course 1", "Course 2", "Course 3", "Course 4"]
  };
  return defaults[examId].map((name, index, values) => ({
    name, marks: "", full: "100", credits: "3",
    optional: exam.optional && index === values.length - 1
  }));
}

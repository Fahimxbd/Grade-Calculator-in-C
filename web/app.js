import { EXAMS, BOARD_SCALE, UNIVERSITY_SCALE, calculate, exampleSubjects, getExam, gradeFromPercent } from "./grading.mjs";

const byId = (id) => document.getElementById(id);
let currentExam = "ssc";
let subjects = exampleSubjects(currentExam);
let lastResult = null;
let darkTheme = true;

const formulas = {
  board: "GPA = total compulsory grade points ÷ compulsory subjects. For SSC, HSC, Dakhil and Alim, an optional 4th subject adds max(0, its grade point − 2) before division. A compulsory F results in Fail.",
  university: "CGPA = sum of (course grade point × course credit) ÷ total attempted credits. Failed courses carry zero points but their attempted credits remain in the denominator. Check your university regulations."
};

function makeInput(type, value, label, field, index, extras = {}) {
  const input = document.createElement("input");
  input.type = type;
  input.value = value ?? "";
  input.setAttribute("aria-label", label + " for subject " + (index + 1));
  input.dataset.field = field;
  input.autocomplete = "off";
  for (const [key, val] of Object.entries(extras)) input.setAttribute(key, val);
  return input;
}

function cell(title, child, className = "") {
  const el = document.createElement("label");
  el.className = "subject-cell " + className;
  const caption = document.createElement("span");
  caption.className = "cell-caption";
  caption.textContent = title;
  el.append(caption, child);
  return el;
}

function renderPicker() {
  const picker = byId("exam-picker");
  picker.replaceChildren();
  for (const exam of EXAMS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "exam-option" + (exam.id === currentExam ? " active" : "");
    button.setAttribute("aria-pressed", String(exam.id === currentExam));
    button.textContent = exam.label;
    button.addEventListener("click", () => {
      currentExam = exam.id;
      subjects = exampleSubjects(currentExam);
      renderAll();
    });
    picker.append(button);
  }
}

function renderSubjects() {
  const container = byId("subject-list");
  const exam = getExam(currentExam);
  container.replaceChildren();
  subjects.forEach((subject, index) => {
    const row = document.createElement("div");
    row.className = "subject-row";
    row.dataset.index = index;
    row.append(cell("Subject / course", makeInput("text", subject.name, "Name", "name", index, { maxlength: "70" }), "name-cell"));
    row.append(cell("Obtained", makeInput("number", subject.marks, "Obtained marks", "marks", index, { min: "0", step: "any", inputmode: "decimal", placeholder: "0" })));
    row.append(cell("Out of", makeInput("number", subject.full, "Full marks", "full", index, { min: "1", step: "any", inputmode: "decimal" })));
    if (exam.category === "university") {
      row.append(cell("Credits", makeInput("number", subject.credits, "Credits", "credits", index, { min: "0.01", max: "30", step: "any", inputmode: "decimal" })));
    } else if (exam.optional) {
      const select = document.createElement("select");
      select.dataset.field = "optional";
      select.setAttribute("aria-label", "Subject type for subject " + (index + 1));
      for (const [value, label] of [["required", "Main"], ["optional", "4th subject"]]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        select.append(option);
      }
      select.value = subject.optional ? "optional" : "required";
      row.append(cell("Type", select));
    }
    const grade = document.createElement("div");
    grade.className = "subject-grade";
    grade.innerHTML = '<span class="cell-caption">Grade</span><span class="grade-pill">—</span>';
    row.append(grade);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-subject";
    remove.setAttribute("aria-label", "Remove subject " + (index + 1));
    remove.title = "Remove subject";
    remove.textContent = "×";
    remove.disabled = subjects.length === 1;
    remove.addEventListener("click", () => {
      subjects.splice(index, 1);
      renderSubjects();
      refreshResult();
    });
    row.append(remove);
    container.append(row);
  });
  byId("subject-count").textContent = subjects.length + (subjects.length === 1 ? " subject" : " subjects");
  for (const row of container.children) updateRowGrade(row);
}

function updateRowGrade(row) {
  const index = Number(row.dataset.index);
  const subject = subjects[index];
  const pill = row.querySelector(".grade-pill");
  const marks = Number(subject.marks);
  const full = Number(subject.full);
  const valid = subject.marks !== "" && subject.full !== "" && Number.isFinite(marks) && Number.isFinite(full) &&
    marks >= 0 && full > 0 && marks <= full;
  pill.className = "grade-pill";
  if (!valid) {
    pill.textContent = "—";
    return;
  }
  const grade = gradeFromPercent((marks / full) * 100, getExam(currentExam).category);
  pill.textContent = grade.letter;
  if (grade.letter === "F") pill.classList.add("fail");
  else if (grade.point >= 4) pill.classList.add("high");
}

function addBreakdown(subject) {
  const row = document.createElement("div");
  row.className = "breakdown-row";
  const name = document.createElement("div");
  name.className = "breakdown-name";
  const strong = document.createElement("strong");
  strong.textContent = subject.name;
  const small = document.createElement("small");
  small.textContent = subject.optional ? "Optional 4th subject" :
    getExam(currentExam).category === "university" ? subject.credits + " credits" : subject.marks + " / " + subject.full + " marks";
  name.append(strong, small);
  const badge = document.createElement("span");
  badge.className = "breakdown-grade" + (subject.letter === "F" ? " fail" : "");
  badge.textContent = subject.letter + " · " + subject.point.toFixed(2);
  row.append(name, badge);
  byId("result-details").append(row);
}

function refreshResult() {
  const exam = getExam(currentExam);
  const resultBox = byId("result-details");
  for (const row of byId("subject-list").children) updateRowGrade(row);
  try {
    const result = calculate(currentExam, subjects);
    lastResult = result;
    byId("value").textContent = result.gpa.toFixed(2);
    byId("value").classList.toggle("score-fail", result.failed);
    byId("result-status").className = "result-status " + (result.failed ? "failed" : "passed");
    byId("result-status").textContent = result.status;
    byId("grade-summary").textContent = result.failed
      ? (exam.category === "board" ? "One or more compulsory subjects failed. An official passing GPA is not awarded." : "A failed course has zero points and still counts toward attempted credits.")
      : (exam.category === "board" ? "Your estimated board GPA is ready. Remember to verify paper-wise pass rules." : "Your credit-weighted CGPA estimate is ready.");
    byId("result-percentage").textContent = result.percentage.toFixed(1) + "%";
    byId("required-count").textContent = String(result.requiredCount);
    byId("result-extra").textContent = exam.category === "university" ? result.totalCredits.toFixed(1) : result.bonus.toFixed(2);
    resultBox.replaceChildren();
    result.subjects.forEach(addBreakdown);
    byId("copy-result").disabled = false;
    byId("print-result").disabled = false;
  } catch (error) {
    lastResult = null;
    byId("value").textContent = "—";
    byId("value").classList.remove("score-fail");
    byId("result-status").className = "result-status pending";
    byId("result-status").textContent = "Awaiting your marks";
    byId("grade-summary").textContent = error.message.includes("required")
      ? "Enter marks for every subject to calculate your result."
      : error.message;
    byId("result-percentage").textContent = "—";
    byId("required-count").textContent = "—";
    byId("result-extra").textContent = "—";
    const empty = document.createElement("p");
    empty.className = "empty-result";
    empty.textContent = "Your subject grades will appear here when all marks are valid.";
    resultBox.replaceChildren(empty);
    byId("copy-result").disabled = true;
    byId("print-result").disabled = true;
  }
}

function renderScale() {
  const exam = getExam(currentExam);
  const isUniversity = exam.category === "university";
  byId("max-value").textContent = isUniversity ? "4.00" : "5.00";
  byId("value-label").textContent = isUniversity ? "CREDIT-WEIGHTED CGPA" : "GRADE POINT AVERAGE";
  byId("required-label").textContent = isUniversity ? "Courses" : "Main subjects";
  byId("result-extra-label").textContent = isUniversity ? "Attempted credits" : "4th subject bonus";
  byId("scale-type").textContent = isUniversity ? "University-style grading · out of 4.00" : "Bangladesh board grading · out of 5.00";
  byId("formula-note").textContent = formulas[exam.category];
  byId("exam-heading").textContent = isUniversity ? "Course marks & credits" : "Subject marks";
  byId("exam-help").textContent = isUniversity ? "Enter marks, full marks and credit hours for each course" : "Each subject can have its own full marks";
  byId("stage-warning").hidden = !exam.legacy;
  byId("stage-warning").textContent = exam.legacy ? "Historical calculation only: " + exam.label + " public examinations are not currently held. Check the grading scheme used in your original year." : "";
  byId("scale-notice").textContent = isUniversity
    ? "This is a common National University-style 4.00 scale, not a universal rule. Course credits and institutional policies vary. Confirm your program's official regulations."
    : "For SSC/HSC-equivalent exams, some papers have separate written, MCQ or practical pass requirements. Enter combined eligible subject marks, then check the official marksheet.";
  const table = byId("grade-table-body");
  table.replaceChildren();
  const scale = isUniversity ? UNIVERSITY_SCALE : BOARD_SCALE;
  scale.forEach((item, index) => {
    const tr = document.createElement("tr");
    const upper = index === 0 ? 100 : scale[index - 1].minimum;
    const values = [item.minimum === 0 ? "Below " + upper + "%" : item.minimum + "% – " + (upper === 100 ? "100%" : "<" + upper + "%"), item.letter, item.point.toFixed(2)];
    values.forEach((value, i) => {
      const td = document.createElement("td");
      td.textContent = value;
      if (i === 1) td.className = "grade-td";
      tr.append(td);
    });
    table.append(tr);
  });
}

function renderAll() {
  renderPicker();
  renderScale();
  renderSubjects();
  refreshResult();
}

byId("subject-list").addEventListener("input", (event) => {
  const input = event.target;
  const index = Number(input.closest(".subject-row")?.dataset.index);
  const field = input.dataset.field;
  if (!Number.isInteger(index) || !field || field === "optional" || !subjects[index]) return;
  subjects[index][field] = input.value;
  refreshResult();
});

byId("subject-list").addEventListener("change", (event) => {
  const select = event.target;
  if (select.dataset.field !== "optional") return;
  const index = Number(select.closest(".subject-row").dataset.index);
  if (select.value === "optional") subjects.forEach((item) => { item.optional = false; });
  subjects[index].optional = select.value === "optional";
  renderSubjects();
  refreshResult();
});

byId("add-subject").addEventListener("click", () => {
  if (subjects.length >= 40) return;
  subjects.push({ name: getExam(currentExam).category === "university" ? "New course" : "New subject", marks: "", full: "100", credits: "3", optional: false });
  renderSubjects();
  refreshResult();
  byId("subject-list").lastElementChild?.querySelector('input[data-field="name"]')?.focus();
});

byId("load-example").addEventListener("click", () => {
  subjects = exampleSubjects(currentExam).map((subject, index) => ({ ...subject, marks: String([86, 72, 66, 92, 81, 75, 88][index % 7]) }));
  renderSubjects();
  refreshResult();
});
byId("clear-marks").addEventListener("click", () => {
  subjects = exampleSubjects(currentExam);
  renderSubjects();
  refreshResult();
});
byId("copy-result").addEventListener("click", async (event) => {
  if (!lastResult) return;
  const report = ["GradePoint BD • " + lastResult.exam.label,
    lastResult.subjects.map((s) => s.name + ": " + s.marks + "/" + s.full + " — " + s.letter + " (" + s.point.toFixed(2) + ")" + (s.optional ? " [4th subject]" : "")).join("\n"),
    "Result: " + lastResult.status, (lastResult.exam.category === "board" ? "GPA" : "CGPA") + ": " + lastResult.gpa.toFixed(2) + " / " + lastResult.maximum.toFixed(2),
    "Unofficial estimate"].join("\n\n");
  try {
    await navigator.clipboard.writeText(report);
    event.currentTarget.firstChild.textContent = "Copied! ";
    setTimeout(() => { event.currentTarget.firstChild.textContent = "Copy results "; }, 1600);
  } catch {
    byId("grade-summary").textContent = "Copy is unavailable in this browser. You can print the result instead.";
  }
});
byId("print-result").addEventListener("click", () => { if (lastResult) window.print(); });
byId("theme-toggle").addEventListener("click", () => {
  darkTheme = !darkTheme;
  document.documentElement.dataset.theme = darkTheme ? "dark" : "light";
  byId("theme-toggle").textContent = darkTheme ? "☀" : "☾";
  document.querySelector('meta[name="theme-color"]').content = darkTheme ? "#081321" : "#f6f9ff";
});
renderAll();

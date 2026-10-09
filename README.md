# GradePoint BD — Grade Calculator (C + Cloudflare Workers)

**A free and responsive Bangladesh grade calculator.** This repository includes a modern browser-based GPA/CGPA calculator deployable on Cloudflare Workers **and** a portable C11 command-line program. No database, API key, account, or paid service is needed to calculate grades.

## Live website

**Cloudflare Workers website:** [**Open GradePoint BD →**](https://grade-calculator-in-c.fahimprivateuser-d8a.workers.dev/)

Direct link: https://grade-calculator-in-c.fahimprivateuser-d8a.workers.dev/

## What it supports

| Level | Scale | Calculation |
| --- | --- | --- |
| PSC / PECE, JSC / JDC | Historical 5.00 estimation | Grade points averaged; for older results check the rules from the relevant year |
| SSC, HSC, Dakhil, Alim | Bangladesh 5.00 | Compulsory grade points averaged; optional 4th-subject bonus if applicable |
| Honours, Degree, Masters | NU-style 4.00 | Sum of course grade points × credits, divided by attempted credits |

- Add, edit and remove subjects. Enter obtained marks and **full marks** (web version converts to percentages).
- Correct school grade points: 80+ A+ (5), 70+ A (4), 60+ A- (3.5), 50+ B (3), 40+ C (2), 33+ D (1), below 33 F (0).
- Fourth subject: optional bonus = max(0, grade point − 2). It **does not** increase the number of compulsory subjects, and a failed optional subject cannot fail an otherwise passing result. Compulsory F means **Fail**.
- NU-style university scale: 80+ A+ (4.00), 75+ A (3.75), 70+ A- (3.50), 65+ B+ (3.25), 60+ B (3.00), 55+ B- (2.75), 50+ C+ (2.50), 45+ C (2.25), 40+ D (2.00), otherwise F (0.00). Failed courses count as attempted credits.
- Dark/light theme, mobile-friendly design, instant results, grade breakdown, example data, copy summary, printable view.
- All grade calculations run in your browser. This app does not send or store marks on a server.

**Important:** PSC/PECE and JSC/JDC are *historical* public examination categories (not presently operating as regular public exams). SSC/HSC-equivalent subjects can have additional separate written, MCQ and practical pass requirements not assessed by this app. University grading differs by institution, course, ordinance and examination year. This is an **unofficial estimate**, not a government results portal or official transcript.

## Run the C calculator in a computer terminal (Linux / macOS)

You need Git and a C compiler (GCC or Clang).

~~~bash
git clone https://github.com/Fahimxbd/Grade-Calculator-in-C.git
cd Grade-Calculator-in-C
gcc -std=c11 -Wall -Wextra -pedantic grade_calculator.c -o grade-calculator
./grade-calculator
~~~

If your machine has Clang instead, replace gcc with clang. On Windows, install Git and MinGW-w64 GCC, then in PowerShell or CMD run:

~~~powershell
git clone https://github.com/Fahimxbd/Grade-Calculator-in-C.git
cd Grade-Calculator-in-C
gcc -std=c11 -Wall -Wextra grade_calculator.c -o grade-calculator.exe
.\grade-calculator.exe
~~~

The legacy file named **Grade Calculator in C** (without an extension) is also maintained with the same updated C source. Use **grade_calculator.c** for normal builds.

## Android Termux — install and run

Install an up-to-date Termux from [F-Droid](https://f-droid.org/packages/com.termux/) or the [official Termux GitHub releases](https://github.com/termux/termux-app/releases). Open Termux and run these commands one at a time:

~~~bash
pkg update -y && pkg upgrade -y
pkg install -y git clang python nodejs-lts
git clone https://github.com/Fahimxbd/Grade-Calculator-in-C.git
cd Grade-Calculator-in-C
clang -std=c11 -Wall -Wextra -pedantic grade_calculator.c -o grade-calculator
./grade-calculator
~~~

To run the **web interface on your Android phone**, from the project folder:

~~~bash
python -m http.server 5173 --directory web
~~~

Open **http://127.0.0.1:5173/** in the Android browser. Keep Termux open while using the local site. Use Ctrl+C to stop the server. Node.js is only needed for the automated grade tests; Python serves the local website without a build step.

To update later:

~~~bash
cd ~/Grade-Calculator-in-C
git pull --ff-only
node --test tests/*.test.mjs
~~~

## Preview the website in a computer terminal

On Linux/macOS, from the repository folder:

~~~bash
python3 -m http.server 5173 --directory web
~~~

On Windows (with Python installed):

~~~powershell
py -m http.server 5173 --directory web
~~~

Then open **http://127.0.0.1:5173/**. The website uses plain HTML, CSS and ES modules, so no bundler or database is required.

## Deploy to Cloudflare Workers

This project uses **Workers Static Assets**, not Cloudflare Pages. The **wrangler.jsonc** file serves the **web/** folder. The site works without a worker script and does not consume external APIs for grade calculations.

Requirements: Node.js 22+, a Cloudflare account, Git, and Wrangler authentication. On a computer:

~~~bash
git clone https://github.com/Fahimxbd/Grade-Calculator-in-C.git
cd Grade-Calculator-in-C
npm install
npm test
npx wrangler login
npx wrangler deploy
~~~

Wrangler prints the actual HTTPS workers.dev URL **after a successful deployment**. Publish only that verified URL in this README.

### GitHub → Cloudflare Workers Builds

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Import a repository** (dashboard labels may change).
2. Connect **Fahimxbd/Grade-Calculator-in-C**, set production branch **main** and root directory to the repository root.
3. Install/build command: **npm install** (no frontend build needed). Deploy command: **npx wrangler deploy**.
4. Confirm the **web/** static files are served through **wrangler.jsonc**. Check the result on a phone and desktop.
5. Use **one** automatic deployment method to avoid duplicate deploys. Never commit Cloudflare tokens or account secrets.

**Android note:** Wrangler's underlying native runtime might not work in Termux. Use Termux for the C program and local web preview; deploy Cloudflare from a supported computer or the Cloudflare dashboard/GitHub integration.

## Automated tests

With Node.js 22 or later:

~~~bash
node --test tests/*.test.mjs
~~~

Tests cover all education levels, board and university grading boundaries, the fourth-subject bonus, failed courses, weighted credits, marks out of different totals, and invalid input. GitHub Actions also checks the browser JavaScript and compiles/smoke-tests the C CLI.

## Files

~~~text
Grade Calculator in C        original source filename (updated)
grade_calculator.c           maintained C11 terminal source
web/index.html               mobile-first app markup
web/styles.css               dark/light responsive design
web/app.js                   browser interactions
web/grading.mjs              pure grading calculations
web/favicon.svg              site icon
tests/grading.test.mjs       calculator logic tests
wrangler.jsonc               Cloudflare Workers Static Assets config
package.json                 tests, local Wrangler, deploy scripts
.github/workflows/ci.yml     Node and C quality checks
~~~

## Grading references

- [Bangladesh SSC/HSC grade ranges (historical grading notification)](https://www.thedailystar.net/news/hsc-goes-under-new-grade-system)
- [National University BBA syllabus/regulations with 4-point grading table](https://igmis.edu.bd/wp-content/uploads/2025/02/BBA-Syllabus-Regulation-2017-2018_NU-pub_date_20-03-20181.pdf)
- [Education reporting on PSC/JSC exams](https://www.thedailystar.net/news/bangladesh/education/news/limit-ssc-exams-5-core-subjects-4103416)

This project is an independent educational tool and is not affiliated with any Bangladesh education board or university.

Copyright © 2026 Fahim Sikder.

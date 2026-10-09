/*
 * GradePoint BD - Bangladesh Grade Calculator (C11 CLI)
 * Maintained source: grade_calculator.c
 * Supports historical PSC/JSC and SSC/HSC/Dakhil/Alim 5.00 GPA,
 * plus Honours/Degree/Masters credit-weighted 4.00 CGPA.
 * Educational estimate only; not an official marksheet.
 */
#include <ctype.h>
#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_SUBJECTS 40

typedef struct {
    const char *letter;
    double point;
} Grade;

typedef struct {
    double marks;
    double credits;
    Grade grade;
} Subject;

static int read_number(const char *prompt, double min, double max, double *out) {
    char buffer[128];
    for (;;) {
        char *end;
        double value;
        printf("%s", prompt);
        fflush(stdout);
        if (!fgets(buffer, sizeof(buffer), stdin)) return 0;
        errno = 0;
        end = buffer;
        value = strtod(buffer, &end);
        if (end == buffer || errno != 0 || !isfinite(value)) {
            puts("Invalid number. Try again.");
            continue;
        }
        while (*end && isspace((unsigned char)*end)) end++;
        if (*end != '\0' || value < min || value > max) {
            printf("Enter a number from %.2f to %.2f.\n", min, max);
            continue;
        }
        *out = value;
        return 1;
    }
}

static int read_integer(const char *prompt, int min, int max, int *out) {
    double value;
    for (;;) {
        if (!read_number(prompt, min, max, &value)) return 0;
        if ((double)(int)value == value) {
            *out = (int)value;
            return 1;
        }
        puts("A whole number is required.");
    }
}

static Grade grade_for(double percentage, int university) {
    static const double board_min[] = {80, 70, 60, 50, 40, 33, 0};
    static const char *board_letter[] = {"A+", "A", "A-", "B", "C", "D", "F"};
    static const double board_point[] = {5, 4, 3.5, 3, 2, 1, 0};
    static const double uni_min[] = {80, 75, 70, 65, 60, 55, 50, 45, 40, 0};
    static const char *uni_letter[] = {"A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"};
    static const double uni_point[] = {4, 3.75, 3.5, 3.25, 3, 2.75, 2.5, 2.25, 2, 0};
    int index;
    int length = university ? 10 : 7;
    for (index = 0; index < length; ++index) {
        double minimum = university ? uni_min[index] : board_min[index];
        if (percentage >= minimum) {
            Grade result = {
                university ? uni_letter[index] : board_letter[index],
                university ? uni_point[index] : board_point[index]
            };
            return result;
        }
    }
    {
        Grade unreachable = {"F", 0};
        return unreachable;
    }
}

int main(void) {
    const char *levels[] = {
        "PSC / PECE (historical)", "JSC / JDC (historical)", "SSC", "HSC",
        "Dakhil", "Alim", "Honours", "Degree", "Masters"
    };
    Subject subjects[MAX_SUBJECTS];
    int level, count, i, is_university, allow_optional, has_optional = 0, failed = 0;
    double points_sum = 0, credits_sum = 0, bonus = 0;
    char prompt[100];
    double value;

    puts("\n================================================");
    puts("          GRADEPOINT BD - GRADE CALCULATOR");
    puts("================================================");
    puts(" 1. PSC/PECE (historical)    2. JSC/JDC (historical)");
    puts(" 3. SSC                      4. HSC");
    puts(" 5. Dakhil                   6. Alim");
    puts(" 7. Honours                  8. Degree");
    puts(" 9. Masters");
    puts("------------------------------------------------");
    if (!read_integer("Choose education level (1-9): ", 1, 9, &level)) return 1;
    is_university = level >= 7;
    allow_optional = level >= 3 && level <= 6;
    if (level <= 2) {
        puts("NOTE: This is a historical estimator, not a current PSC/JSC exam result.");
    }
    if (!read_integer("Number of compulsory subjects/courses (1-40): ", 1, MAX_SUBJECTS, &count)) return 1;

    for (i = 0; i < count; ++i) {
        printf("\n%s %d of %d\n", is_university ? "Course" : "Subject", i + 1, count);
        if (!read_number("Obtained marks as percentage (0-100): ", 0, 100, &subjects[i].marks)) return 1;
        subjects[i].credits = 1;
        if (is_university) {
            if (!read_number("Attempted credit hours (0.01-30): ", 0.01, 30, &subjects[i].credits)) return 1;
        }
        subjects[i].grade = grade_for(subjects[i].marks, is_university);
        if (subjects[i].grade.point == 0) failed = 1;
        points_sum += subjects[i].grade.point * subjects[i].credits;
        credits_sum += subjects[i].credits;
    }

    if (allow_optional) {
        int yes;
        if (!read_integer("\nInclude a fourth/optional subject? (1=yes, 0=no): ", 0, 1, &yes)) return 1;
        if (yes) {
            has_optional = 1;
            if (!read_number("Optional subject marks as percentage (0-100): ", 0, 100, &value)) return 1;
            bonus = grade_for(value, 0).point - 2;
            if (bonus < 0) bonus = 0;
            printf("Optional subject: %s (%.2f points); bonus = %.2f\n", grade_for(value, 0).letter, grade_for(value, 0).point, bonus);
        }
    }

    printf("\n================ %s RESULT ================\n", levels[level - 1]);
    for (i = 0; i < count; ++i) {
        printf("%-10s %2d  Marks: %6.2f%%  Grade: %-3s  GP: %.2f",
               is_university ? "Course" : "Subject",
               i + 1, subjects[i].marks, subjects[i].grade.letter, subjects[i].grade.point);
        if (is_university) printf("  Credits: %.2f", subjects[i].credits);
        putchar('\n');
    }
    if (is_university) {
        printf("\nAttempted credits: %.2f\n", credits_sum);
        printf("CGPA: %.2f / 4.00\n", points_sum / credits_sum);
        puts(failed ? "Status: One or more courses failed" : "Status: All courses passed");
        puts("NOTE: University regulations and credit rules vary.");
    } else {
        double gpa = failed ? 0 : (points_sum + bonus) / count;
        if (gpa > 5) gpa = 5;
        if (has_optional) printf("\nFourth-subject bonus: %.2f\n", bonus);
        printf("GPA: %.2f / 5.00\n", gpa);
        puts(failed ? "Status: FAIL - no passing GPA awarded" : "Status: PASS");
        puts("NOTE: Separate theory/MCQ/practical pass rules are not evaluated.");
    }
    puts("Unofficial calculation - confirm with your board or university.");
    puts("================================================\n");
    return 0;
}

const { before, describe, test } = require("node:test");
const assert = require("node:assert");

let durationMinutesBetween;
let endAfterStartChange;
let endDateTimeFromDuration;
let isEndBeforeStart;

before(async () => {
    const dateRange = await import("../../src/maintenance-date-range.mjs");
    durationMinutesBetween = dateRange.durationMinutesBetween;
    endAfterStartChange = dateRange.endAfterStartChange;
    endDateTimeFromDuration = dateRange.endDateTimeFromDuration;
    isEndBeforeStart = dateRange.isEndBeforeStart;
});

describe("maintenance date range", () => {
    test("changing the start time keeps the selected duration", () => {
        assert.strictEqual(endDateTimeFromDuration("2026-02-24T01:00", 60), "2026-02-24T02:00");

        const end = endAfterStartChange({
            strategy: "single",
            endManuallyEdited: false,
            selectedDurationMinutes: 60,
            start: "2026-02-24T03:00",
        });
        assert.strictEqual(end, "2026-02-24T04:00");
    });

    test("a manual end edit keeps the end time when the start time changes", () => {
        const end = endAfterStartChange({
            strategy: "single",
            endManuallyEdited: true,
            selectedDurationMinutes: 60,
            start: "2026-02-24T03:00",
        });
        assert.strictEqual(end, null);
    });

    test("duration still moves only the end time", () => {
        const start = "2026-02-24T03:00";
        assert.strictEqual(endDateTimeFromDuration(start, 120), "2026-02-24T05:00");
        assert.strictEqual(durationMinutesBetween(start, "2026-02-24T05:00"), 120);
    });

    test("a missing or negative duration does not invent an end time", () => {
        assert.strictEqual(
            endAfterStartChange({
                strategy: "single",
                endManuallyEdited: false,
                selectedDurationMinutes: null,
                start: "2026-02-24T03:00",
            }),
            null
        );
        assert.strictEqual(
            endAfterStartChange({
                strategy: "single",
                endManuallyEdited: false,
                selectedDurationMinutes: -15,
                start: "2026-02-24T03:00",
            }),
            null
        );
    });

    test("other strategies do not recompute the end time from the window duration", () => {
        const end = endAfterStartChange({
            strategy: "cron",
            endManuallyEdited: false,
            selectedDurationMinutes: 60,
            start: "2026-02-24T03:00",
        });
        assert.strictEqual(end, null);
    });

    test("an earlier end is invalid and an equal end is allowed", () => {
        assert.strictEqual(isEndBeforeStart("2026-02-24T03:00", "2026-02-24T02:00"), true);
        assert.strictEqual(isEndBeforeStart("2026-02-24T03:00", "2026-02-24T03:00"), false);
        assert.strictEqual(isEndBeforeStart("2026-02-24T03:00", "2026-02-24T04:00"), false);
        assert.strictEqual(isEndBeforeStart("2026-02-24T03:00", ""), false);
    });

    test("parses API datetimes and rolls over midnight", () => {
        assert.strictEqual(endDateTimeFromDuration("2026-02-24 23:30:00", 90), "2026-02-25T01:00");
        assert.strictEqual(durationMinutesBetween("2026-02-24 23:30:00", "2026-02-25T01:00"), 90);
    });
});

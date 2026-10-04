/**
 * Date helpers for the single maintenance window.
 * The form stores datetime-local values. The API may also return
 * "YYYY-MM-DD HH:mm:ss", so parsing accepts that shape too.
 */

/**
 * Parse a maintenance datetime.
 * @param {string|null|undefined} value Raw datetime from the form or API.
 * @returns {Date|null} Local date, or null when the value is empty or invalid.
 */
function parseMaintenanceDateTime(value) {
    if (value == null || value === "") {
        return null;
    }

    const normalized = String(value).trim().replace(" ", "T");
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

/**
 * Format a date for an input[type=datetime-local].
 * @param {Date} date Date to format.
 * @returns {string} "YYYY-MM-DDTHH:mm" in local time.
 */
function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Add minutes to a start datetime.
 * @param {string|null|undefined} startValue Start datetime.
 * @param {number} durationMinutes Duration in minutes.
 * @returns {string|null} End datetime, or null when the start or duration is unusable.
 */
function endDateTimeFromDuration(startValue, durationMinutes) {
    const start = parseMaintenanceDateTime(startValue);
    if (!start || !Number.isFinite(durationMinutes)) {
        return null;
    }

    return formatDateTimeLocal(new Date(start.getTime() + durationMinutes * 60000));
}

/**
 * Minutes between two datetimes, rounded the same way as the duration buttons.
 * @param {string|null|undefined} startValue Start datetime.
 * @param {string|null|undefined} endValue End datetime.
 * @returns {number|null} Duration in minutes, or null when either value is unusable.
 */
function durationMinutesBetween(startValue, endValue) {
    const start = parseMaintenanceDateTime(startValue);
    const end = parseMaintenanceDateTime(endValue);
    if (!start || !end) {
        return null;
    }

    return Math.round((end.getTime() - start.getTime()) / 60000);
}

/**
 * True when both datetimes parse and the end is strictly earlier than the start.
 * Empty or partial values are not treated as invalid, so the field can be edited freely.
 * @param {string|null|undefined} startValue Start datetime.
 * @param {string|null|undefined} endValue End datetime.
 * @returns {boolean} Whether the end predates the start.
 */
function isEndBeforeStart(startValue, endValue) {
    const start = parseMaintenanceDateTime(startValue);
    const end = parseMaintenanceDateTime(endValue);
    if (!start || !end) {
        return false;
    }

    return end.getTime() < start.getTime();
}

/**
 * End datetime to write when the start time changes.
 * Returns null when the end time must be left alone: another strategy, a manual
 * end edit, or no duration to apply.
 * @param {object} state Current window state.
 * @param {string} state.strategy Maintenance strategy.
 * @param {boolean} state.endManuallyEdited Whether the user edited the end time.
 * @param {number|null} state.selectedDurationMinutes Duration that should follow the start.
 * @param {string} state.start New start datetime.
 * @returns {string|null} Replacement end datetime, or null to keep the current end.
 */
function endAfterStartChange(state) {
    if (state.strategy !== "single" || state.endManuallyEdited) {
        return null;
    }

    if (!Number.isFinite(state.selectedDurationMinutes) || state.selectedDurationMinutes < 0) {
        return null;
    }

    return endDateTimeFromDuration(state.start, state.selectedDurationMinutes);
}

export { durationMinutesBetween, endAfterStartChange, endDateTimeFromDuration, formatDateTimeLocal, isEndBeforeStart };

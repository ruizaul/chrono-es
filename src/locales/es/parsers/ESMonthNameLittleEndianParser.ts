import { ParsingContext } from "../../../chrono";
import { ParsingResult } from "../../../results";
import { findYearClosestToRef } from "../../../calculation/years";
import { MONTH_DICTIONARY } from "../constants";
import { YEAR_PATTERN, parseYear } from "../constants";
import { matchAnyPattern } from "../../../utils/pattern";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";
import dayjs from "dayjs";

const PATTERN = new RegExp(
    `([0-9]{1,2})(?:º|ª|°)?` +
        "(?:\\s*(?:desde|de|\\-|\\–|ao?|\\s)\\s*([0-9]{1,2})(?:º|ª|°)?)?\\s*(?:de)?\\s*" +
        `(?:-|/|\\s*(?:de|,)?\\s*)` +
        `(${matchAnyPattern(MONTH_DICTIONARY)})` +
        `(?:\\s*(?:de|,)?\\s*(${YEAR_PATTERN}))?` +
        `(?=\\W|$)`,
    "i"
);

const DATE_GROUP = 1;
const DATE_TO_GROUP = 2;
const MONTH_NAME_GROUP = 3;
const YEAR_GROUP = 4;

export default class ESMonthNameLittleEndianParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp {
        return PATTERN;
    }

    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingResult {
        const result = context.createParsingResult(match.index, match[0]);

        const month = MONTH_DICTIONARY[match[MONTH_NAME_GROUP].toLowerCase()];
        const day = parseInt(match[DATE_GROUP]);

        // Validación de días y meses
        if (day > 31 || day < 1) {
            return null; // Día no válido
        }

        if (!this.isValidDate(day, month)) {
            return null; // Fecha inválida, como "31 de febrero"
        }

        result.start.assign("month", month);
        result.start.assign("day", day);

        if (match[YEAR_GROUP]) {
            const yearNumber = parseYear(match[YEAR_GROUP]);
            result.start.assign("year", yearNumber);
        } else {
            const year = findYearClosestToRef(context.refDate, day, month);
            result.start.imply("year", year);
        }

        if (match[DATE_TO_GROUP]) {
            const endDate = parseInt(match[DATE_TO_GROUP]);

            if (endDate < day) {
                // Si la fecha de fin es menor que la de inicio, asumimos que es al mes siguiente
                result.end = result.start.clone();
                result.end.assign("day", endDate);
                result.end.assign("month", (month % 12) + 1); // Mes siguiente
            } else {
                result.end = result.start.clone();
                result.end.assign("day", endDate);
            }
        }

        return result;
    }

    private isValidDate(day: number, month: number): boolean {
        // Validar si el día y el mes forman una fecha válida
        const maxDays = [31, this.isLeapYear(new Date().getFullYear()) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return day <= maxDays[month - 1];
    }

    private isLeapYear(year: number): boolean {
        // Comprobar si un año es bisiesto
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }
}

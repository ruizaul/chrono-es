import { ParsingContext } from "../../../chrono";
import { ParsingComponents } from "../../../results";
import { WEEKDAY_DICTIONARY } from "../constants";
import { matchAnyPattern } from "../../../utils/pattern";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";
import { createParsingComponentsAtWeekday } from "../../../common/calculation/weekdays";

const PATTERN = new RegExp(
    "(?:(?:\\,|\\(|\\（)\\s*)?" +
        "(?:(este|esta|pasado|pr[oó]ximo|siguiente|anterior)\\s*)?" +  // Soporte para más modificadores
        `(${matchAnyPattern(WEEKDAY_DICTIONARY)})` +
        "(?:\\s*(?:\\,|\\)|\\）))?" +
        "(?:\\s*(este|esta|pasado|pr[óo]ximo|siguiente|anterior)\\s*semana)?" +  // Soporte para expresiones como "esta semana"
        "(?=\\W|\\d|$)",
    "i"
);

const PREFIX_GROUP = 1;
const WEEKDAY_GROUP = 2;
const POSTFIX_GROUP = 3;

export default class ESWeekdayParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp {
        return PATTERN;
    }

    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents | null {
        const dayOfWeek = match[WEEKDAY_GROUP].toLowerCase();
        const weekday = WEEKDAY_DICTIONARY[dayOfWeek];
        if (weekday === undefined) {
            return null; // Si el día de la semana no es reconocido, devolver null
        }

        const prefix = match[PREFIX_GROUP];
        const postfix = match[POSTFIX_GROUP];
        let norm = (prefix || postfix || "").toLowerCase();

        let modifier: string | null = null;
        if (norm === "pasado" || norm === "anterior") {
            modifier = "last"; // Ajustamos para interpretar correctamente "pasado" y "anterior"
        } else if (norm === "próximo" || norm === "proximo" || norm === "siguiente") {
            modifier = "next"; // Ajustamos para interpretar correctamente "próximo" y "siguiente"
        } else if (norm === "este" || norm === "esta") {
            modifier = "this"; // Interpretamos "este" o "esta" como "esta semana"
        }

        return createParsingComponentsAtWeekday(context.reference, weekday, modifier);
    }
}

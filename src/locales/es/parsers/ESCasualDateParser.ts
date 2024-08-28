import { ParsingContext } from "../../../chrono";
import { ParsingComponents, ParsingResult } from "../../../results";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";
import * as references from "../../../common/casualReferences";

export default class ESCasualDateParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(context: ParsingContext): RegExp {
        return /(ahora|hoy|mañana|pasado mañana|ayer|anoche|anteayer|esta\s*(mañana|tarde|noche)|al\s*(mediodía|amanecer|atardecer|anochecer|medianoche)|hace\s*(\d+)\s*días?|dentro\s*de\s*(\d+)\s*días?|la\s*(próxima|pasada)\s*(semana|quincena|mes)|el\s*(próximo|último)?\s*(lunes|martes|miércoles|jueves|viernes|sábado|domingo)|este\s*(fin de semana|fin de semana)|fin de semana)(?=\W|$)/i;
    }

    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents | ParsingResult {
        const lowerText = match[0].toLowerCase();
        const component = context.createParsingComponents();

        switch (lowerText) {
            case "ahora":
                return references.now(context.reference);

            case "hoy":
                return references.today(context.reference);

            case "mañana":
                return references.tomorrow(context.reference);

            case "pasado mañana":
                return references.theDayAfter(context.reference, 2);

            case "ayer":
                return references.yesterday(context.reference);

            case "anteayer":
                return references.theDayBefore(context.reference, 2);

            case "anoche":
                return references.yesterday(context.reference).imply('hour', 22);

            case "esta mañana":
                return references.today(context.reference).imply('hour', 9);

            case "esta tarde":
                return references.today(context.reference).imply('hour', 15);

            case "esta noche":
                return references.today(context.reference).imply('hour', 20);

            case "al mediodía":
                return references.today(context.reference).imply('hour', 12);

            case "a la medianoche":
            case "al anochecer":
                return references.today(context.reference).imply('hour', 0);

            case "al amanecer":
                return references.today(context.reference).imply('hour', 6);

            case "al atardecer":
                return references.today(context.reference).imply('hour', 18);

            case "fin de semana":
            case "este fin de semana":
                return references.nextWeekend(context.reference);

            default:
                if (/hace\s*(\d+)\s*días?/.test(lowerText)) {
                    const daysAgo = parseInt(lowerText.match(/hace\s*(\d+)\s*días?/)[1]);
                    return references.theDayBefore(context.reference, daysAgo);
                }

                if (/dentro\s*de\s*(\d+)\s*días?/.test(lowerText)) {
                    const daysAfter = parseInt(lowerText.match(/dentro\s*de\s*(\d+)\s*días?/)[1]);
                    return references.theDayAfter(context.reference, daysAfter);
                }

                if (/la\s*(próxima|pasada)\s*semana/.test(lowerText)) {
                    if (lowerText.includes("próxima")) {
                        return references.nextWeek(context.reference);
                    } else {
                        return references.lastWeek(context.reference);
                    }
                }

                if (/la\s*(próxima|pasada)\s*quincena/.test(lowerText)) {
                    if (lowerText.includes("próxima")) {
                        return references.nextFortnight(context.reference);
                    } else {
                        return references.lastFortnight(context.reference);
                    }
                }

                if (/la\s*(próxima|pasada)\s*mes/.test(lowerText)) {
                    if (lowerText.includes("próxima")) {
                        return references.nextMonth(context.reference);
                    } else {
                        return references.lastMonth(context.reference);
                    }
                }

                const matchDayOfWeek = lowerText.match(/(?:el\s*(próximo|último)?)?\s*(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i);
                if (matchDayOfWeek) {
                    const prefix = matchDayOfWeek[1];
                    const dayOfWeek = matchDayOfWeek[2];
                    if (prefix === "próximo") {
                        return references.nextDayOfWeek(context.reference, dayOfWeek);
                    } else if (prefix === "último") {
                        return references.lastDayOfWeek(context.reference, dayOfWeek);
                    } else {
                        return references.thisDayOfWeek(context.reference, dayOfWeek);
                    }
                }

                break;
        }

        return component;
    }
}

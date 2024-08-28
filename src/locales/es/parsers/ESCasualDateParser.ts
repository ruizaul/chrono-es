import { ParsingContext, ReferenceWithTimezone } from "../../../chrono";
import { ParsingComponents, ParsingResult } from "../../../results";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";
import * as references from "../../../common/casualReferences";
import dayjs from "dayjs";

export default class ESCasualDateParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(context: ParsingContext): RegExp {
        return /(ahora|hoy|mañana|pasado mañana|ayer|anoche|anteayer|esta\s*(mañana|tarde|noche)|el\s*(lunes|martes|miércoles|jueves|viernes|sábado|domingo)|el\s*(próximo|último)?\s*(lunes|martes|miércoles|jueves|viernes|sábado|domingo)|fin de semana|este fin de semana)(?=\W|$)/i;
    }

    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents | ParsingResult {
        const lowerText = match[0].toLowerCase();
        const reference = context.reference.instant;  // Use el objeto instant de la referencia
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

            case "fin de semana":
            case "este fin de semana":
                return this.calculateNextWeekend(context.reference);

            default:
                const dayOfWeekMatch = lowerText.match(/(?:el\s*(próximo|último)?)?\s*(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i);
                if (dayOfWeekMatch) {
                    const prefix = dayOfWeekMatch[1];
                    const dayOfWeek = dayOfWeekMatch[2];
                    return this.calculateDayOfWeek(context.reference, dayOfWeek, prefix);
                }

                break;
        }

        return component;
    }

    private calculateNextWeekend(reference: ReferenceWithTimezone): ParsingComponents {
        const ref = dayjs(reference.instant);  // Asegúrate de que dayjs use la referencia con zona horaria ajustada
        const nextSaturday = ref.day(6).isBefore(ref) ? ref.day(6 + 7) : ref.day(6);
        const nextSunday = nextSaturday.add(1, 'day');

        const components = ParsingComponents.createRelativeFromReference(reference.instant, {});
        components.assign('day', nextSaturday.date());
        components.assign('month', nextSaturday.month() + 1);
        components.assign('year', nextSaturday.year());

        components.imply('weekday', 6); // Sábado
        components.imply('weekday', 0); // Domingo
        return components;
    }

    private calculateDayOfWeek(reference: ReferenceWithTimezone, dayOfWeek: string, prefix: string): ParsingComponents {
        const weekdayMapping: { [key: string]: number } = {
            'lunes': 1,
            'martes': 2,
            'miércoles': 3,
            'jueves': 4,
            'viernes': 5,
            'sábado': 6,
            'domingo': 0
        };

        const ref = dayjs(reference.instant);
        let targetDay = weekdayMapping[dayOfWeek.toLowerCase()];

        if (prefix === 'próximo') {
            if (ref.day() >= targetDay) {
                targetDay += 7; // Mueve al próximo día de la semana
            }
        } else if (prefix === 'último') {
            if (ref.day() <= targetDay) {
                targetDay -= 7; // Mueve al último día de la semana
            }
        } else {
            // Default is to get the "this" week's day
            if (ref.day() > targetDay) {
                targetDay += 7;
            }
        }

        const resultDate = ref.day(targetDay);
        const components = ParsingComponents.createRelativeFromReference(reference.instant, {});
        components.assign('day', resultDate.date());
        components.assign('month', resultDate.month() + 1);
        components.assign('year', resultDate.year());
        components.imply('weekday', targetDay % 7);
        return components;
    }
}

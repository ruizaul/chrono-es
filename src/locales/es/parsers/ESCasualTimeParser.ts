import { ParsingContext } from "../../../chrono";
import { Meridiem } from "../../../types";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";
import { assignTheNextDay } from "../../../utils/dayjs";
import dayjs from "dayjs";

export default class ESCasualTimeParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern() {
        return /(?:esta\s*)?(mañana|tarde|medianoche|mediodia|mediodía|noche|amanecer|atardecer|primera hora de la mañana|última hora de la tarde|última hora de la noche|primera hora de la tarde|primera hora de la noche)(?=\W|$)/i;
    }

    innerExtract(context: ParsingContext, match: RegExpMatchArray) {
        const targetDate = dayjs(context.refDate);
        const component = context.createParsingComponents();
        const timeExpression = match[1].toLowerCase();

        switch (timeExpression) {
            case "tarde":
                component.imply("meridiem", Meridiem.PM);
                component.imply("hour", 15);  // Considerando que "tarde" puede comenzar alrededor de las 3 PM
                break;

            case "noche":
                component.imply("meridiem", Meridiem.PM);
                component.imply("hour", 22);  // Generalmente considerado como tarde en la noche
                break;

            case "mañana":
                component.imply("meridiem", Meridiem.AM);
                component.imply("hour", 6);   // Madrugada o primera hora de la mañana
                break;

            case "medianoche":
                assignTheNextDay(component, targetDate);
                component.imply("hour", 0);
                component.imply("minute", 0);
                component.imply("second", 0);
                break;

            case "mediodia":
            case "mediodía":
                component.imply("meridiem", Meridiem.AM);
                component.imply("hour", 12);
                break;

            case "amanecer":
                component.imply("meridiem", Meridiem.AM);
                component.imply("hour", 5);   // Aproximación del amanecer
                break;

            case "atardecer":
                component.imply("meridiem", Meridiem.PM);
                component.imply("hour", 18);  // Aproximación del atardecer
                break;

            case "primera hora de la mañana":
                component.imply("meridiem", Meridiem.AM);
                component.imply("hour", 7);   // Primera hora laboral común
                break;

            case "última hora de la tarde":
                component.imply("meridiem", Meridiem.PM);
                component.imply("hour", 17);  // Última hora de la tarde antes de la noche
                break;

            case "última hora de la noche":
                component.imply("meridiem", Meridiem.PM);
                component.imply("hour", 23);  // Cerca de la medianoche
                break;

            case "primera hora de la tarde":
                component.imply("meridiem", Meridiem.PM);
                component.imply("hour", 13);  // Alrededor de la 1 PM, justo después del mediodía
                break;

            case "primera hora de la noche":
                component.imply("meridiem", Meridiem.PM);
                component.imply("hour", 20);  // Primera hora de la noche
                break;
        }

        return component;
    }
}

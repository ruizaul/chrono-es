import { TIME_UNITS_PATTERN, parseTimeUnits } from "../constants";
import { ParsingContext } from "../../../chrono";
import { ParsingComponents } from "../../../results";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";

export default class ESTimeUnitWithinFormatParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp {
        // Mejorar el patrón para capturar más expresiones comunes y manejar mejor los espacios y separadores
        return new RegExp(
            `(?:en|por|durante|de|dentro\\s*de|en\\s*el\\s*transcurso\\s*de)\\s*(${TIME_UNITS_PATTERN})(?=\\W|$)`,
            "i"
        );
    }

    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents {
        // Extraer las unidades de tiempo del match utilizando el patrón mejorado
        const timeUnits = parseTimeUnits(match[1]);

        // Validación para asegurar que las unidades de tiempo son válidas
        if (!timeUnits || Object.keys(timeUnits).length === 0) {
            return null;
        }

        // Crear y devolver los componentes de tiempo relativos a partir de la referencia de contexto
        return ParsingComponents.createRelativeFromReference(context.reference, timeUnits);
    }
}

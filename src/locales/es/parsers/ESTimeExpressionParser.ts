import { AbstractTimeExpressionParser } from "../../../common/parsers/AbstractTimeExpressionParser";
import { ParsingContext, ParsingComponents } from "../../../chrono";

export default class ESTimeExpressionParser extends AbstractTimeExpressionParser {
    primaryPrefix(): string {
        // Agregamos más prefijos comunes que se usan en español para denotar tiempos
        return "(?:(?:a las|a la|de las|desde las|las|al?|de|del|sobre|entre)\\s*)?";
    }

    followingPhase(): string {
        // Agregamos conectores comunes que podrían preceder a una expresión de tiempo
        return "\\s*(?:\\-|\\–|\\~|\\〜|a(?:l)?|\\?)\\s*";
    }

    extractPrimaryTimeComponents(context: ParsingContext, match: RegExpMatchArray): ParsingComponents | null {
        // Excluir casos que parecen años, como "2020"
        if (match[0].match(/^\s*\d{4}\s*$/)) {
            return null;
        }

        // Llamada al método original para extraer los componentes de tiempo principales
        const components = super.extractPrimaryTimeComponents(context, match);

        if (!components) return null;

        // Lógica específica para interpretar tiempo en español
        const timeString = match[0].toLowerCase();

        // Ajustar para casos comunes de uso horario español como "por la mañana", "por la tarde", etc.
        if (timeString.includes("mañana")) {
            components.imply('meridiem', 0); // AM
        } else if (timeString.includes("tarde")) {
            components.imply('meridiem', 1); // PM
        } else if (timeString.includes("noche")) {
            components.imply('meridiem', 1); // PM, aunque podría ser más tarde, 22h por defecto
            components.imply('hour', 22);
        } else if (timeString.includes("mediodía") || timeString.includes("mediodia")) {
            components.imply('hour', 12);
            components.imply('meridiem', 1); // PM
        } else if (timeString.includes("medianoche")) {
            components.imply('hour', 0);
            components.imply('minute', 0);
        }

        // Soporte para otros modificadores comunes de tiempo en español
        if (timeString.includes("temprano")) {
            components.imply('hour', 6); // Asumir temprano en la mañana
        } else if (timeString.includes("tarde")) {
            components.imply('hour', 17); // Tarde en el día
        } else if (timeString.includes("media mañana")) {
            components.imply('hour', 10); // Media mañana, entre 9 y 11
        } else if (timeString.includes("media tarde")) {
            components.imply('hour', 15); // Media tarde, alrededor de las 3 PM
        } else if (timeString.includes("mediodía") || timeString.includes("mediodia")) {
            components.imply('hour', 12); // Mediodía
        }

        return components;
    }
}

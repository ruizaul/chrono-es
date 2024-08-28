import { AbstractTimeExpressionParser } from "../../../common/parsers/AbstractTimeExpressionParser";
import { ParsingContext, ParsingComponents } from "../../../chrono";

export default class ESTimeExpressionParser extends AbstractTimeExpressionParser {
  primaryPrefix(): string {
    return "(?:(?:as las|desde las|las|al?|de|del|a la|a las)\\s*)?";
  }

  followingPhase(): string {
    return "\\s*(?:\\-|\\–|\\~|\\〜|a(?:l)?|\\?)\\s*";
  }

  extractPrimaryTimeComponents(context: ParsingContext, match: RegExpMatchArray): ParsingComponents | null {
    // Excluir casos que parecen años, como "2020"
    if (match[0].match(/^\s*\d{4}\s*$/)) {
      return null;
    }

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

    return components;
  }
}

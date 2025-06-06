declare module 'plantuml-encoder' {
  /**
   * Encode PlantUML source code to a URL-safe string
   * @param source PlantUML source code
   * @returns Encoded string that can be used in PlantUML server URLs
   */
  export function encode(source: string): string;

  /**
   * Decode a PlantUML encoded string back to source code
   * @param encoded Encoded PlantUML string
   * @returns Original PlantUML source code
   */
  export function decode(encoded: string): string;
}

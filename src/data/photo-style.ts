/**
 * Shared visual language for every AI food photo, so all 73 catalog images
 * look like one professional shoot. `shot()` wraps a dish-specific scene
 * (subject, vessel, garnish, surface) with the house style and the no-text rules.
 */
export type Angle = "overhead" | "45" | "eye-level" | "30";

const ANGLE: Record<Angle, string> = {
  overhead: "top-down overhead angle",
  "45": "45-degree angle",
  "eye-level": "eye-level side angle",
  "30": "30-degree angle",
};

export const PHOTO_STYLE =
  "Warm natural window light from the side with soft shadows, high-end restaurant plating, rustic yet modern deli aesthetic, " +
  "shallow depth of field with a creamy bokeh background, shot on a full-frame DSLR with an 85mm lens at f/2.8";

export const PHOTO_NEGATIVE = "No text, no lettering, no labels, no watermark, no logos, no people, no hands.";

export function shot(scene: string, angle: Angle = "45"): string {
  return `Professional food photography of ${scene} ${PHOTO_STYLE}, ${ANGLE[angle]}, ultra-realistic textures. ${PHOTO_NEGATIVE}`;
}

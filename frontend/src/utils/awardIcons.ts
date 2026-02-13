import earlyBadge from "../assets/early_badge.png";
import mediumBadge from "../assets/medium_badge.png";
import owlBadge from "../assets/owl-badge.png";
import type { AwardIconKey } from "../types/domain";

const awardIconMap: Record<AwardIconKey, string> = {
  early: earlyBadge,
  medium: mediumBadge,
  owl: owlBadge,
};

export function getAwardIcon(iconKey: AwardIconKey): string {
  return awardIconMap[iconKey] ?? earlyBadge;
}

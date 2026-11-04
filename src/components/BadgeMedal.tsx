// A badge's picture: its uploaded image or its icon, in a medal cut from the identity's slanted shape.
import { Award, Crown, Flag, Gauge, Medal, Route, Star, Target, Timer, Trophy, Wrench, Zap, type LucideIcon } from "lucide-react";
import Image from "next/image";
import type { BadgeIcon } from "@/config/literals";
import { API_ROUTES } from "@/config/routes";

export const BADGE_ICON_GLYPHS: Record<BadgeIcon, LucideIcon> = {
  trophy: Trophy,
  flag: Flag,
  gauge: Gauge,
  timer: Timer,
  medal: Medal,
  award: Award,
  star: Star,
  zap: Zap,
  wrench: Wrench,
  route: Route,
  target: Target,
  crown: Crown,
};

interface BadgeMedalProps {
  id: string;
  icon: string;
  imageUpdatedAt: Date | string | null;
  earned?: boolean;
  size?: number;
}

/** Draws the medal. Unearned badges are faded by the stylesheet. */
export function BadgeMedal({ id, icon, imageUpdatedAt, earned = true, size = 56 }: BadgeMedalProps) {
  const Glyph = BADGE_ICON_GLYPHS[icon as BadgeIcon] ?? Trophy;
  return (
    <span className={earned ? "badge-medal" : "badge-medal badge-medal--locked"} style={{ width: size, height: size }} aria-hidden="true">
      {imageUpdatedAt ? (
        <Image src={API_ROUTES.badgeImage(id, new Date(imageUpdatedAt).getTime())} alt="" width={size} height={size} unoptimized />
      ) : (
        <Glyph size={Math.round(size * 0.5)} strokeWidth={1.75} />
      )}
    </span>
  );
}

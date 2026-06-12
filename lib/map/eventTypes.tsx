import {
  Swords, Castle, Anchor, ScrollText, Handshake, Users,
  Flag, Compass, Flame, Landmark, Sparkles, Bomb, type LucideIcon,
} from "lucide-react";
import type { EventType } from "@/lib/content/schema";

export const EVENT_TYPE_META: Record<EventType, { label: string; Icon: LucideIcon }> = {
  battle: { label: "Battle", Icon: Swords },
  siege: { label: "Siege", Icon: Castle },
  naval: { label: "Naval battle", Icon: Anchor },
  treaty: { label: "Treaty", Icon: ScrollText },
  alliance: { label: "Alliance", Icon: Handshake },
  summit: { label: "Summit", Icon: Users },
  conquest: { label: "Conquest", Icon: Flag },
  expedition: { label: "Expedition", Icon: Compass },
  uprising: { label: "Uprising", Icon: Flame },
  founding: { label: "Founding", Icon: Landmark },
  discovery: { label: "Discovery", Icon: Sparkles },
  bombing: { label: "Bombing", Icon: Bomb },
};

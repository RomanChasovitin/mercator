import { AtlasApp } from "@/components/atlas/AtlasApp";
import { loadStories } from "@/lib/content/load";

export default function Page() {
  const stories = loadStories();
  return <AtlasApp stories={stories} />;
}

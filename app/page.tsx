import { AtlasApp } from "@/components/atlas/AtlasApp";
import { loadCollections, loadEpochs } from "@/lib/content/load";

export default function Page() {
  return <AtlasApp epochs={loadEpochs()} collections={loadCollections()} />;
}

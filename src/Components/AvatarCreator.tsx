import { useState } from "react";
import {
  AvatarCreator as RPMAvatarCreator,
  type AvatarCreatorConfig,
  type AvatarExportedEvent,
} from "@readyplayerme/react-avatar-creator";

interface AvatarCreatorProps {
  onAvatarCreated: (avatarUrl: string) => void;
  onClose: () => void;
}

const config: AvatarCreatorConfig = {
  clearCache: true,
  bodyType: "fullbody",
  quickStart: false,
  language: "en",
};

const style = { width: "100%", height: "100%", border: "none" };

export default function AvatarCreator({
  onAvatarCreated,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClose,
}: AvatarCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleOnAvatarExported = (event: AvatarExportedEvent) => {
    console.log(`Avatar URL is: ${event.data.url}`);
    setIsCreating(false);
    onAvatarCreated(event.data.url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full h-full max-w-4xl max-h-[90vh] relative overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
          {/* <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button> */}
        </div>

        <div className="w-full h-full">
          {isCreating && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
              <div className="text-white text-xl">Creating your avatar...</div>
            </div>
          )}

          <RPMAvatarCreator
            subdomain="demo"
            config={config}
            style={style}
            onAvatarExported={handleOnAvatarExported}
          />
        </div>
      </div>
    </div>
  );
}

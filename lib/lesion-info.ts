import { lesionsData } from "./lesions-data";

interface LesionInfo {
  name: string;
  therapyMessage: string;
}

const lesionDatabaseByName: Record<string, LesionInfo> = {};
const lesionDatabaseById: Record<number, LesionInfo> = {};

lesionsData.forEach((lesion) => {
  if (lesion.lesionName && lesion.therapyMessage) {
    const lesionInfo: LesionInfo = {
      name: lesion.lesionName,
      therapyMessage: lesion.therapyMessage,
    };

    const normalizedName = lesion.lesionName.toLowerCase().trim();
    lesionDatabaseByName[normalizedName] = lesionInfo;

    // ✅ Fix: allow findingid = 0 (Healthy skin)
    if (lesion.findingid !== undefined && lesion.findingid !== null) {
      lesionDatabaseById[lesion.findingid] = lesionInfo;
    }
  }
});

const defaultResponse: LesionInfo = {
  name: "I'm not sure what the condition of your skin is",
  therapyMessage: "Just to be safe, get this checked out by a dermatologist.",
};

export function getLesionData(lesionName: string | undefined): LesionInfo {
  if (!lesionName) return defaultResponse;

  const normalizedName = lesionName.toLowerCase().trim();
  return lesionDatabaseByName[normalizedName] || defaultResponse;
}

export function getLesionDataById(findingId: number | undefined): LesionInfo {
  if (findingId === undefined || findingId === null) return defaultResponse;

  return lesionDatabaseById[findingId] || defaultResponse;
}

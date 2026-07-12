import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDurasiMenit(menit: number) {
  const jam = Math.floor(menit / 60);
  const sisaMenit = menit % 60;
  if (jam > 0) {
    return sisaMenit > 0 ? `${jam} jam ${sisaMenit} menit` : `${jam} jam`;
  }
  return `${sisaMenit} menit`;
}

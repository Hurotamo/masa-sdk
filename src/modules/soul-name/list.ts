import type { MasaInterface, SoulNameDetails } from "../../interface";
import { logger } from "../../utils";
import { printSoulName } from "./helpers";
import { loadSoulNameDetailsByAddress } from "./load";

/**
 * list soul names
 *
 * @param masa
 * @param address
 */
export const listSoulNames = async (
  masa: MasaInterface,
  address?: string,
): Promise<SoulNameDetails[]> => {
  address = address || (await masa.config.signer.getAddress());
  return await loadSoulNameDetailsByAddress(masa, address);
};

/**
 * list soul names and print them
 *
 * @param masa
 * @param address
 */
export const listSoulNamesAndPrint = async (
  masa: MasaInterface,
  address?: string,
): Promise<SoulNameDetails[]> => {
  address = address || (await masa.config.signer.getAddress());
  const soulNames = await listSoulNames(masa, address);

  if (soulNames.length > 0) {
    let index = 0;
    for (const soulName of soulNames) {
      printSoulName(soulName, index, masa.config.verbose);
      index++;
    }
  } else {
    logger("error", `No soulnames found for '${address}'`);
  }

  return soulNames;
};

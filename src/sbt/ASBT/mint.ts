import Masa from "../../masa";
import { ReferenceSBTAuthority } from "@masa-finance/masa-contracts-identity";
import { constants, Contract } from "ethers";

import { abi } from "@masa-finance/masa-contracts-identity/artifacts/contracts/reference/ReferenceSBTAuthority.sol/ReferenceSBTAuthority.json";
import { Messages } from "../../utils";
import { LogDescription } from "@ethersproject/abi";

export const mintASBT = async (
  masa: Masa,
  sbtContract: ReferenceSBTAuthority,
  receiver: string
) => {
  const [name, symbol] = await Promise.all([
    sbtContract.name(),
    sbtContract.symbol(),
  ]);

  console.log("Minting SBT on:");
  console.log(`Contract Name: '${name}'`);
  console.log(`Contract Symbol: '${symbol}'`);
  console.log(`Contract Address: '${sbtContract.address}'`);
  console.log(`To receiver: '${receiver}'`);

  const asbt: ReferenceSBTAuthority = (await new Contract(
    sbtContract.address,
    abi,
    masa.config.wallet
  ).deployed()) as ReferenceSBTAuthority;

  const { wait, hash } = await asbt["mint(address,address)"](
    constants.AddressZero,
    receiver
  );
  console.log(Messages.WaitingToFinalize(hash));

  const { logs } = await wait();

  const parsedLogs = masa.contracts.parseLogs(logs, [asbt]);

  const mintEvent = parsedLogs.find(
    (log: LogDescription) => log.name === "Mint"
  );

  if (mintEvent) {
    const { args } = mintEvent;
    console.log(
      `Minted to token with ID: ${args._tokenId} receiver '${args._owner}'`
    );
  }
};

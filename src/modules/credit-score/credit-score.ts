import type { SoulboundCreditScore } from "@masa-finance/masa-contracts-identity";
import type { BigNumber } from "ethers";

import type {
  BaseResult,
  GenerateCreditScoreResult,
  MasaInterface,
  PaymentMethod,
} from "../../interface";
import { CreditScoreDetails } from "../../interface";
import { MasaLinkable } from "../masa-linkable";
import { createCreditScore } from "./create";
import { listCreditScores } from "./list";
import { loadCreditScores } from "./load";

export class MasaCreditScore extends MasaLinkable<SoulboundCreditScore> {
  constructor(masa: MasaInterface) {
    super(masa, masa.contracts.instances.SoulboundCreditScoreContract);
  }

  create = (
    paymentMethod: PaymentMethod = "ETH",
  ): Promise<GenerateCreditScoreResult> =>
    createCreditScore(this.masa, paymentMethod);
  burn = (creditScoreId: BigNumber): Promise<BaseResult> =>
    this.masa.contracts.creditScore.burn(creditScoreId);
  list = (address?: string): Promise<CreditScoreDetails[]> =>
    listCreditScores(this.masa, address);
  load = (
    identityIdOrAddress: BigNumber | string,
  ): Promise<CreditScoreDetails[]> =>
    loadCreditScores(this.masa, identityIdOrAddress);
}

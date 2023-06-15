import { MasaSBT } from "@masa-finance/masa-contracts-identity";

import { MasaModuleBase } from "../../../../base";
import type {
  IIdentityContracts,
  MasaInterface,
  PaymentMethod,
  PriceInformation,
} from "../../../../interface";

export class SBTContractWrapper<
  Contract extends MasaSBT
> extends MasaModuleBase {
  constructor(
    masa: MasaInterface,
    instances: IIdentityContracts,
    public readonly contract: Contract
  ) {
    super(masa, instances);
  }

  /**
   *
   * @param paymentMethod
   * @param slippage
   */
  getPrice = (
    paymentMethod: PaymentMethod,
    slippage: number | undefined = 250
  ): Promise<PriceInformation> =>
    this.getMintPrice(paymentMethod, this.contract, slippage);
}

import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export interface EnvResult {
    masterChef: Contract;
    lodgeToken: Contract;

    mim: Contract;
    weth: Contract;

    router: Contract;

    owner: SignerWithAddress;
    alice: SignerWithAddress;
    bob: SignerWithAddress;
    dev: SignerWithAddress;

    partner: SignerWithAddress;
}
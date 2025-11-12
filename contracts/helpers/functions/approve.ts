import { ERC20__factory, USDC } from "@/typechain-types";
import { ethers } from "ethers";

export const approve = async (
  account: ethers.Signer,
  erc20Address: string,
  spender: string,
  amount: bigint,
) => {
  const erc20 = new ethers.Contract(
    erc20Address,
    ERC20__factory.abi,
    account,
  ) as unknown as USDC;

  const tx = await erc20.approve(spender, amount);

  return tx;
};

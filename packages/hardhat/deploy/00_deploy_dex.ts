import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { DEX } from "../typechain-types/contracts/DEX";
import { Balloons } from "../typechain-types/contracts/Balloons";

/**
 * Deploys Balloons and DEX contracts, then seeds the DEX with initial liquidity.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Balloons", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  const balloons: Balloons = await hre.ethers.getContract("Balloons", deployer);
  const balloonsAddress = await balloons.getAddress();

  await deploy("DEX", {
    from: deployer,
    args: [balloonsAddress],
    log: true,
    autoMine: true,
  });

  const dex = (await hre.ethers.getContract("DEX", deployer)) as DEX;
  const dexAddress = await dex.getAddress();

  // Approve DEX to spend deployer's Balloons, then seed the pool with 5 ETH + 5 BAL
  console.log("Approving DEX (" + dexAddress + ") to take Balloons from main account...");
  await balloons.approve(dexAddress, hre.ethers.parseEther("100"));
  console.log("INIT exchange...");
  await dex.init(hre.ethers.parseEther("5"), {
    value: hre.ethers.parseEther("5"),
    gasLimit: 200000,
  });
};

export default deployYourContract;

deployYourContract.tags = ["Balloons", "DEX"];

"use client";

// @refresh reset
import { Contract } from "@scaffold-ui/debug-contracts";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { ContractName } from "~~/utils/scaffold-eth/contract";

type ContractUIProps = {
  contractName: ContractName;
  className?: string;
};

/**
 * UI component to interface with deployed contracts.
 **/
export const ContractUI = ({ contractName }: ContractUIProps) => {
  const { targetNetwork } = useTargetNetwork();
  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo({ contractName });

  if (deployedContractLoading) {
    return (
      <div className="mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!deployedContractData) {
    return (
      <p className="text-2xl mt-10 text-[#d4e5ff]">
        No contract found by the name of {contractName} on chain {targetNetwork.name}!
      </p>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-white/15 bg-[#0f1726]/95 p-4 sm:p-5 text-[#e6efff]">
      <Contract contractName={contractName as string} contract={deployedContractData} chainId={targetNetwork.id} />
    </div>
  );
};

"use client";

import { useEffect, useMemo } from "react";
import { ContractUI } from "./ContractUI";
import "@scaffold-ui/debug-contracts/styles.css";
import { useSessionStorage } from "usehooks-ts";
import { BarsArrowUpIcon } from "@heroicons/react/20/solid";
import { ContractName, GenericContract } from "~~/utils/scaffold-eth/contract";
import { useAllContracts } from "~~/utils/scaffold-eth/contractsData";

const selectedContractStorageKey = "scaffoldEth2.selectedContract";

export function DebugContracts() {
  const contractsData = useAllContracts();
  const contractNames = useMemo(
    () =>
      Object.keys(contractsData).sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      }) as ContractName[],
    [contractsData],
  );

  const [selectedContract, setSelectedContract] = useSessionStorage<ContractName>(
    selectedContractStorageKey,
    contractNames[0],
    { initializeWithValue: false },
  );

  useEffect(() => {
    if (!contractNames.includes(selectedContract)) {
      setSelectedContract(contractNames[0]);
    }
  }, [contractNames, selectedContract, setSelectedContract]);

  return (
    <div className="flex flex-col gap-y-6 lg:gap-y-8 py-4 lg:py-8 justify-center items-center text-[#e6efff]">
      {contractNames.length === 0 ? (
        <p className="text-2xl mt-10 text-[#d4e5ff]">No contracts found!</p>
      ) : (
        <>
          {contractNames.length > 1 && (
            <div className="flex flex-row gap-2 w-full max-w-7xl pb-1 px-4 lg:px-2 flex-wrap">
              {contractNames.map(contractName => (
                <button
                  className={`rounded-xl px-3 py-2 text-sm border transition ${
                    contractName === selectedContract
                      ? "border-[#4ca6ff] bg-[#4ca6ff]/20 text-[#f4f8ff]"
                      : "border-white/20 bg-[#0d1728] text-[#aec1de] hover:text-[#f4f8ff]"
                  }`}
                  key={contractName}
                  onClick={() => setSelectedContract(contractName)}
                >
                  {contractName}
                  {(contractsData[contractName] as GenericContract)?.external && (
                    <span className="tooltip tooltip-top tooltip-accent" data-tip="External contract">
                      <BarsArrowUpIcon className="h-4 w-4 cursor-pointer" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {contractNames.map(
            contractName =>
              contractName === selectedContract && <ContractUI key={contractName} contractName={contractName} />,
          )}
        </>
      )}
    </div>
  );
}

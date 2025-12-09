import type { ContractSummary } from "@/types/contracts";

const globalForContracts = globalThis as unknown as {
  contractsStore?: ContractSummary[];
};

const contractsTable: ContractSummary[] = globalForContracts.contractsStore ?? [];
if (!globalForContracts.contractsStore) {
  globalForContracts.contractsStore = contractsTable;
}

export async function insertContract(contract: ContractSummary): Promise<void> {
  contractsTable.push(contract);
}

export async function listContracts(userId?: string): Promise<ContractSummary[]> {
  if (!userId) {
    return [...contractsTable];
  }
  return contractsTable.filter((contract) => contract.userId === userId);
}

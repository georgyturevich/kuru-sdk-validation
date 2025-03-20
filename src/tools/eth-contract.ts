import {Fragment, JsonFragment} from "@ethersproject/abi/src.ts/fragments";
import {ethers} from "ethers";

class ContractDescriptor{
    contractName: string;
    abi: ReadonlyArray<Fragment | JsonFragment | string>

    constructor(contractName: string, abi: ReadonlyArray<Fragment | JsonFragment | string>) {
        this.contractName = contractName;
        this.abi = abi;
    }
}

function printAbi(contract: ContractDescriptor) {
    console.log(contract.contractName, new ethers.utils.Interface(contract.abi).format(ethers.utils.FormatTypes.full));
}

function printFunctionSignature(contract: ContractDescriptor, functionName: string) {
    const contractInterface = new ethers.utils.Interface(contract.abi);
    try {
        const functionFragment = contractInterface.getFunction(functionName);
        console.log(`${contract.contractName}.${functionName}: ${functionFragment.format(ethers.utils.FormatTypes.full)}`);
    } catch (e) {
        console.error(`Function '${functionName}' not found in contract '${contract.contractName}'. Error: ${e}`);
    }
}

export {ContractDescriptor, printAbi, printFunctionSignature};
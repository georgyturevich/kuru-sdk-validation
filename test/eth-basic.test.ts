import { describe, it, expect } from '@jest/globals';
import { ethers } from "ethers";

import * as KuruConfig from '../config/config.json';

describe('Eth Test', () => {

    it('Basic Test', async () => {
        const { rpcUrl } = KuruConfig;
        console.log("Try to connect to", rpcUrl);
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log("Network:", network);
        expect(1).toEqual(1)
    }, 100000);
});
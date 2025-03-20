import { describe, it, expect, beforeAll } from '@jest/globals';
import { ethers } from "ethers";

import * as KuruConfig from '../config/config.json';
import * as KuruSdk from '@kuru-labs/kuru-sdk'
import { testnetMarketAddresses } from '../src/constants/markets';
import assert from "node:assert";


describe('Margin Test', () => {
    const { rpcUrl } = KuruConfig;
    let provider: ethers.providers.JsonRpcProvider;


    beforeAll(async () => {
        provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log("Network:", network);
    });

    // Create a table of test cases with all available market addresses
    const marketTests = Object.entries(testnetMarketAddresses).map(([marketName, marketAddress]) => ({
        name: marketName,
        address: marketAddress
    })).filter((el) => {
        return el.name === "DAK_MON" || el.name === "KB_MON";
    });

    // Run a test for each market address
    describe.each(marketTests)('Market: $name', ({ name, address }) => {
        it(`Get Margin balances for ${name}`, async () => {
            console.log(`Testing market: ${name}, address: ${address}`);
            const useraddress = process.env.USER_ADDRESS;
            assert(useraddress, "USER_ADDRESS is not set");

            try {

                const balance = await KuruSdk.MarginBalance.getBalance(
                    provider,
                    KuruConfig.marginAccountAddress,
                    useraddress as string,
                    address
                );
                console.log(`${name} Balance: formatted ETH`, ethers.utils.formatUnits(balance), "balance.toString():", balance.toString());
                
                // Add meaningful assertions here if needed
                expect(balance).toBeDefined();
            } catch (error) {
                console.error(`Error fetching margin balance for ${name}:`, error);
                throw error; // Re-throw to make the test fail
            }
        }, 100000000);
    });

    // describe('Pool Tests', () => {
    //     it(`Get all pools`, async () => {
    //         try {
    //             const kuruApi = "https://api.testnet.kuru.io";
    //             const poolFetcher = new PoolFetcher(kuruApi);
    //             const pools = await poolFetcher.getAllPools();
    //
    //             console.log("Found pools:", pools);
    //             expect(pools).toBeDefined();
    //             expect(Array.isArray(pools)).toBe(true);
    //         } catch (error) {
    //             console.error("Test failed:", error);
    //             throw error;
    //         }
    //     }, 30000);
    // });
});

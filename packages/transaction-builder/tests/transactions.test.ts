import { KeyManager } from '@pokt-foundation/pocketjs-signer'
import { JsonRpcProvider } from '@pokt-foundation/pocketjs-provider'
import { ChainID, TransactionBuilder } from '../src/tx-builder'
import {
  MsgProtoAppStake,
  MsgProtoAppUnstake,
  MsgProtoNodeUnstake,
  MsgProtoNodeStakeTx,
  MsgProtoSend,
  MsgProtoNodeUnjail,
} from '../src/models'
import { RawTxRequest } from '@pokt-foundation/pocketjs-types'

const PRIVATE_KEY =
  '1f8cbde30ef5a9db0a5a9d5eb40536fc9defc318b8581d543808b7504e0902bcb243b27bc9fbe5580457a46370ae5f03a6f6753633e51efdaf2cf534fdc26cc3'
const PUBLIC_KEY =
  'b243b27bc9fbe5580457a46370ae5f03a6f6753633e51efdaf2cf534fdc26cc3'
const ADDRESS = 'b50a6e20d3733fb89631ae32385b3c85c533c560'

describe('TransactionBuilder Tests', () => {
  const serviceURL = new URL('http://localhost:8081')
  let signer: KeyManager,
    provider: JsonRpcProvider,
    chainID: ChainID,
    transactionBuilder: TransactionBuilder

  beforeAll(async () => {
    signer = await KeyManager.fromPrivateKey(PRIVATE_KEY)
    provider = new JsonRpcProvider({ rpcUrl: 'http://localhost:8081' })
    chainID = 'mainnet'

    transactionBuilder = new TransactionBuilder({
      provider,
      signer,
      chainID,
    })
  })

  it('Creates a new TransactionBuilder with the provided params', async () => {
    expect(transactionBuilder.getChainID()).toBe(chainID)
  })

  it('Can switch the chainID on the fly', async () => {
    expect(transactionBuilder.getChainID()).toBe(chainID)

    chainID = 'testnet'
    transactionBuilder.setChainID(chainID as ChainID)
    expect(transactionBuilder.getChainID()).toBe(chainID)

    transactionBuilder.setChainID('mainnet')
  })

  describe('TransactionBuilder:Messages:HappyPaths', () => {
    it('General happy path: creates properly formatted messages without errors', async () => {
      const signer = await KeyManager.fromPrivateKey(PRIVATE_KEY)
      const provider = new JsonRpcProvider({ rpcUrl: 'http://localhost:8081' })
      const chainID = 'mainnet'

      const transactionBuilder = new TransactionBuilder({
        provider,
        signer,
        chainID,
      })

      const sendMsg = transactionBuilder.send({
        toAddress: 'fcf719ca739dccbc281b12bc0d671aaa7a015848',
        amount: '1000000',
      })
      expect(sendMsg instanceof MsgProtoSend).toBe(true)
      expect(sendMsg.fromAddress).toBe(signer.getAddress())

      const appStakeMsg = transactionBuilder.appStake({
        appPubKey: PUBLIC_KEY,
        chains: ['0040'],
        amount: '69420000000',
      })
      expect(appStakeMsg instanceof MsgProtoAppStake).toBe(true)

      const appUnstakeMsg = transactionBuilder.appUnstake(ADDRESS)
      expect(appUnstakeMsg instanceof MsgProtoAppUnstake).toBe(true)

      const nodeStakeMsg = transactionBuilder.nodeStake({
        nodePubKey: signer.getPublicKey(),
        chains: ['0040'],
        amount: '69420000000',
        serviceURL: new URL('https://mofongonodes.co:8081'),
      })
      expect(nodeStakeMsg instanceof MsgProtoNodeStakeTx).toBe(true)

      const nodeUnstakeMsg = transactionBuilder.nodeUnstake({})
      expect(nodeUnstakeMsg instanceof MsgProtoNodeUnstake).toBe(true)

      const nodeUnjailMsg = transactionBuilder.nodeUnjail({})
      expect(nodeUnjailMsg instanceof MsgProtoNodeUnjail).toBe(true)
    })
  })

  describe('TransactionBuilder:Messages:UnhappyPaths:MsgProtoSend', () => {
    test('Invalid case: same addresses', () => {
      expect(() =>
        transactionBuilder.send({
          fromAddress: 'fcf719ca739dccbc281b12bc0d671aaa7a015848',
          toAddress: 'fcf719ca739dccbc281b12bc0d671aaa7a015848',
          amount: '1000000',
        })
      ).toThrow(/fromAddress cannot be equal/)
    })
    test('Invalid case: amount < 0', () => {
      expect(() =>
        transactionBuilder.send({
          fromAddress: 'b50a6e20d3733fb89631ae32385b3c85c533c560',
          toAddress: 'fcf719ca739dccbc281b12bc0d671aaa7a015848',
          amount: '-1',
        })
      ).toThrow(/Amount < 0/)
    })
    test('Invalid case: invalid input for amount', () => {
      expect(() =>
        transactionBuilder.send({
          fromAddress: 'b50a6e20d3733fb89631ae32385b3c85c533c560',
          toAddress: 'fcf719ca739dccbc281b12bc0d671aaa7a015848',
          amount: 'adf80',
        })
      ).toThrow(/Amount is not a valid number/)
    })
  })

  describe('TransactionBuilder:Messages:UnhappyPaths:MsgProtoAppStake', () => {
    test('Invalid case: amount to stake too small (below 1 POKT)', () => {
      expect(() =>
        transactionBuilder.appStake({
          appPubKey: PUBLIC_KEY,
          chains: ['0040'],
          amount: '10000',
        })
      ).toThrow(/Amount should be bigger than/)
    })
    test('Invalid case: chains empty', () => {
      expect(() =>
        transactionBuilder.appStake({
          appPubKey: PUBLIC_KEY,
          chains: [],
          amount: '1000000',
        })
      ).toThrow(/empty/)
    })
    test('Invalid case: invalid input for amount', () => {
      expect(() =>
        transactionBuilder.appStake({
          appPubKey: PUBLIC_KEY,
          chains: ['0040'],
          amount: 'askdja0912',
        })
      ).toThrow(/Amount is not a valid number/)
    })
  })

  describe('TransactionBuilder:Messages:UnhappyPaths:MsgProtoNodeStakeTx', () => {
    test('Invalid case: amount to stake too small', () => {
      expect(() =>
        transactionBuilder.nodeStake({
          nodePubKey: PUBLIC_KEY,
          chains: ['0040'],
          amount: '69420',
          serviceURL: serviceURL,
        })
      ).toThrow(/Amount below minimum/)
    })
    test('Invalid case: chains empty', () => {
      expect(() =>
        transactionBuilder.nodeStake({
          nodePubKey: PUBLIC_KEY,
          chains: [],
          amount: '69420000000000',
          serviceURL: serviceURL,
        })
      ).toThrow(/empty/)
    })
    test('Invalid case: invalid input for amount', () => {
      expect(() =>
        transactionBuilder.nodeStake({
          nodePubKey: PUBLIC_KEY,
          chains: [],
          amount: 'asdfasd6778',
          serviceURL: serviceURL,
        })
      ).toThrow(/Amount is not a valid number/)
    })
  })

  describe('TransactionBuilder:createTransaction:HappyPath', () => {
    test('Creates a RawTxRequest for MsgProtoSend', async () => {
      const txMsg = transactionBuilder.send({
        fromAddress: 'b50a6e20d3733fb89631ae32385b3c85c533c560',
        toAddress: 'fcf719ca739dccbc281b12bc0d671aaa7a015848',
        amount: '1000000',
      })

      const rawTxRequest = await transactionBuilder.createTransaction({ txMsg })

      expect(rawTxRequest instanceof RawTxRequest).toBe(true)
      expect(rawTxRequest.address).toBe(signer.getAddress())
    })
    test('Creates a RawTxRequest for MsgProtoAppStake', async () => {
      const txMsg = transactionBuilder.appStake({
        appPubKey: signer.getPublicKey(),
        chains: ['0040'],
        amount: '1000000',
      })

      const rawTxRequest = await transactionBuilder.createTransaction({ txMsg })

      expect(rawTxRequest instanceof RawTxRequest).toBe(true)
      expect(rawTxRequest.address).toBe(signer.getAddress())
    })
    test('Creates a RawTxRequest for MsgProtoAppUnstake', async () => {
      const txMsg = transactionBuilder.appUnstake(signer.getAddress())

      const rawTxRequest = await transactionBuilder.createTransaction({ txMsg })

      expect(rawTxRequest instanceof RawTxRequest).toBe(true)
      expect(rawTxRequest.address).toBe(signer.getAddress())
    })
    test('Creates a RawTxRequest for MsgProtoNodeStakeTx', async () => {
      const txMsg = transactionBuilder.nodeStake({
        nodePubKey: signer.getPublicKey(),
        chains: ['0040'],
        amount: '15000000000',
        serviceURL,
      })

      const rawTxRequest = await transactionBuilder.createTransaction({ txMsg })

      expect(rawTxRequest instanceof RawTxRequest).toBe(true)
      expect(rawTxRequest.address).toBe(signer.getAddress())
    })
    test('Creates a RawTxRequest for MsgProtoNodeUnstake', async () => {
      const txMsg = transactionBuilder.nodeUnstake({})

      const rawTxRequest = await transactionBuilder.createTransaction({ txMsg })

      expect(rawTxRequest instanceof RawTxRequest).toBe(true)
      expect(rawTxRequest.address).toBe(signer.getAddress())
    })
    test('Creates a RawTxRequest for MsgProtoNodeUnjail', async () => {
      const txMsg = transactionBuilder.nodeUnjail({})

      const rawTxRequest = await transactionBuilder.createTransaction({ txMsg })

      expect(rawTxRequest instanceof RawTxRequest).toBe(true)
      expect(rawTxRequest.address).toBe(signer.getAddress())
    })
  })
})

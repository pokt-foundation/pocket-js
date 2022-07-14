import { Buffer } from 'buffer'
import { MsgBeginNodeUnstake8 } from './../proto/generated/tx-signer'
import { Any } from '../proto/generated/google/protobuf/any'
import { TxMsg } from './tx-msg'
/**
 * Model representing a MsgNodeStake to unstake as an Node in the Pocket Network
 */
export class MsgProtoNodeUnstake extends TxMsg {
  public readonly KEY: string = '/x.nodes.MsgBeginUnstake'
  public readonly AMINO_KEY: string = 'pos/MsgBeginUnstake'
  public readonly nodeAddress: string
  public readonly signerAddress: string

  /**
   * @param {string} nodeAddress - Node address
   */
  public constructor(nodeAddress: string, signerAddress: string) {
    super()
    this.nodeAddress = nodeAddress
    this.signerAddress = signerAddress
  }
  /**
   * Converts an Msg Object to StdSignDoc
   * @returns {object} - Msg type key value.
   * @memberof MsgNodeUnstake
   */
  public toStdSignDocMsgObj(): object {
    return {
      type: this.AMINO_KEY,
      value: {
        signer_address: this.signerAddress,
        validator_address: this.nodeAddress,
      },
    }
  }

  /**
   * Converts an Msg Object to StdTx
   * @returns {any} - Msg type key value.
   * @memberof MsgNodeUnstake
   */
  public toStdTxMsgObj(): any {
    const data = {
      Address: Buffer.from(this.nodeAddress, 'hex'),
      Signer: Buffer.from(this.signerAddress, 'hex'),
    }

    return Any.fromJSON({
      typeUrl: this.KEY,
      value: Buffer.from(MsgBeginNodeUnstake8.encode(data).finish()).toString(
        'base64'
      ),
    })
  }
}

import { SubstrateBlock } from '@subql/types'
import { Timekeeper } from '../types'
import { SNAPSHOT_INTERVAL_SECONDS } from '../config'

/**
 * Manages the in memory tracking of time and indexing of periods
 */
export class TimekeeperService {
  constructor(lastPeriodStart: Date) {
    this._currentPeriodStart = lastPeriodStart
  }

  static init = async function (): Promise<TimekeeperService> {
    let lastPeriodStart: Date
    try {
      lastPeriodStart = (await Timekeeper.get('global')).lastPeriodStart
    } catch (error) {
      lastPeriodStart = new Date(0)
    }
    return new TimekeeperService(lastPeriodStart)
  }

  private _currentPeriodStart: Date = null
  public getCurrentPeriod = (): Date => this._currentPeriodStart
  public processBlock = (block: SubstrateBlock): boolean => {
    const blockPeriodStart = getPeriodStart(block.timestamp)
    const isNewPeriod = blockPeriodStart.valueOf() > this._currentPeriodStart.valueOf()
    if (isNewPeriod) this._currentPeriodStart = blockPeriodStart
    return isNewPeriod
  }
  public update = async (blockPeriodStart: Date) => {
    const timekeeper = new Timekeeper('global')
    timekeeper.lastPeriodStart = blockPeriodStart
    await timekeeper.save()
  }
}

/**
 * Computes the start timestamp given an arbitrary block timestamb
 * @param timestamp Arbitrary timestamp, usually from a block
 * @returns Corresponding timestamp at the start of the period
 */
export function getPeriodStart(timestamp: Date): Date {
  const timestampSec = timestamp.valueOf() / 1000
  const periodStartTimestampSec = timestampSec - (timestampSec % SNAPSHOT_INTERVAL_SECONDS)
  return new Date(periodStartTimestampSec * 1000)
}

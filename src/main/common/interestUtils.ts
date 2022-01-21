import * as moment from 'moment';

import { InterestDateType } from '../app/common/interestDateType';
import { MomentFactory } from '../common/momentFactory';
import { InterestRateOption } from '../features/claim/form/models/interestRateOption';
import { Claim } from '../app/claims/models/claim';
import { InterestData } from '../app/common/interestData';
import { ClaimAmountBreakdown } from '../features/claim/form/models/claimAmountBreakdown';
import { DraftClaim } from '../app/draft/models/draftClaim';
import { isAfter4pm } from '../common/dateUtils';
import { InterestType as ClaimInterestType } from '../app/claims/models/interestType';
import { YesNoOption } from '../app/models/yesNoOption';
import { InterestTypeOption } from '../features/claim/form/models/interestType';
import { calculateInterest } from '../app/common/calculate-interest/calculateInterest';

export function getStandardInterestRate (): number {
  return 8.0;
}

function getInterestDateOrIssueDate (claim: Claim): moment.Moment {
  if (claim.claimData.interest.interestDate.type === InterestDateType.CUSTOM) {
    return claim.claimData.interest.interestDate.date;
  } else {
    return claim.issuedOn;
  }
}

function getInterestRate (claimDraft: DraftClaim): number {
  if (claimDraft.interest.option === YesNoOption.NO) {
    return 0.00;
  }

  if (claimDraft.interestRate.type === InterestRateOption.STANDARD) {
    return getStandardInterestRate();
  } else {
    return claimDraft.interestRate.rate;
  }
}

export async function getInterestDetails (claim: Claim): Promise<InterestData> {
  if (claim.claimData.interest.type === ClaimInterestType.NO_INTEREST || claim.claimData.interest.type === undefined) {
    return undefined;
  }

  const interestFromDate: moment.Moment = getInterestDateOrIssueDate(claim);
  const interestToDate: moment.Moment = moment.max(MomentFactory.currentDate(), claim.issuedOn);
  const numberOfDays: number = interestToDate.diff(interestFromDate, 'days');

  const rate = claim.claimData.interest.rate;
  const interest: number = claim.totalInterest;

  const specificDailyAmount = claim.claimData.interest.specificDailyAmount;
  return { interestFromDate, interestToDate, numberOfDays, interest, rate, specificDailyAmount };
}

export async function draftInterestAmount (claimDraft: DraftClaim): Promise<number> {
  if (claimDraft.interest.option === YesNoOption.NO) {
    return 0.00;
  }

  if (claimDraft.interestType.option === InterestTypeOption.BREAKDOWN) {
    return claimDraft.interestTotal.amount;
  }
  const interest: number = getInterestRate(claimDraft);
  const breakdown: ClaimAmountBreakdown = claimDraft.amount;
  const issuedDate: moment.Moment = isAfter4pm() ? MomentFactory.currentDate().add(1, 'day') : MomentFactory.currentDate();
  const interestStartDate: moment.Moment = claimDraft.interestDate.type === InterestDateType.SUBMISSION ? issuedDate :
    claimDraft.interestStartDate.date.toMoment();
  const claimAmount: number = breakdown.totalAmount();

  return calculateInterest(
    claimAmount,
    interest,
    interestStartDate,
  );
}

export async function draftClaimAmountWithInterest (claimDraft: DraftClaim): Promise<number> {
  const interest: number = await draftInterestAmount(claimDraft);
  const claimAmount: number = claimDraft.amount.totalAmount();

  return claimAmount + interest;
}
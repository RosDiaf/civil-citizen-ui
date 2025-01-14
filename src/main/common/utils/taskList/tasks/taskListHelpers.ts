import {Claim} from '../../../models/claim';
import {Respondent} from '../../../../common/models/respondent';
import {CounterpartyType} from '../../../../common/models/counterpartyType';
import PaymentOptionType from '../../../../common/form/models/admission/paymentOption/paymentOptionType';
import RejectAllOfClaimType from '../../../../common/form/models/rejectAllOfClaimType';
import {YesNo} from '../../../../common/form/models/yesNo';

export const isCaseDataMissing = (caseData: Claim): boolean => {
  return !caseData;
};

export const hasCorrespondenceAndPrimaryAddress = (respondent1: Respondent): boolean => {
  return !!(respondent1?.primaryAddress && (respondent1?.postToThisAddress === YesNo.NO || respondent1?.correspondenceAddress));
};

export const hasDateOfBirthIfIndividual = (respondent1: Respondent): boolean => {
  return !!(respondent1?.type !== CounterpartyType.INDIVIDUAL || (respondent1?.type === CounterpartyType.INDIVIDUAL && respondent1?.dateOfBirth));
};

export const isResponseTypeMissing = (respondent1: Respondent): boolean => {
  return !respondent1?.responseType;
};

export const isPaymentOptionMissing = (caseData: Claim): boolean => {
  return !caseData?.paymentOption;
};

export const isNotPayImmediatelyResponse = (caseData: Claim): boolean => {
  return (caseData?.paymentOption !== PaymentOptionType.IMMEDIATELY);
};

export const isRepaymentPlanMissing = (caseData: Claim): boolean => {
  return !caseData.repaymentPlan;
};

export const isStatementOfMeansComplete = (caseData: Claim): boolean => {
  // TODO: this should replicate statement of means guard logic CIV-2630
  return !!(caseData?.statementOfMeans && Object.keys(caseData.statementOfMeans).length > 1);
};

export const financialDetailsShared = (caseData: Claim): boolean => {
  return !!caseData?.taskSharedFinancialDetails;
};

export const isIndividualWithStatementOfMeansComplete = (caseData: Claim): boolean => {
  return (isCounterpartyIndividual(caseData.respondent1) && isStatementOfMeansComplete(caseData));
};

export const isCounterpartyIndividual = (respondent1: Respondent): boolean => {
  return respondent1.type === CounterpartyType.INDIVIDUAL || respondent1.type === CounterpartyType.SOLE_TRADER;
};

export const isCounterpartyCompany = (respondent1: Respondent): boolean => {
  return respondent1.type === CounterpartyType.ORGANISATION || respondent1.type === CounterpartyType.COMPANY;
};

export const hasContactPersonAndCompanyPhone = (caseData: Claim): boolean => {
  return !!(caseData.mediation?.companyTelephoneNumber?.mediationContactPerson && caseData.mediation?.companyTelephoneNumber?.mediationPhoneNumber);
};

export const isFullDefenceAndNotCounterClaim = (caseData: Claim): boolean => {
  return caseData.isFullDefence() && caseData.rejectAllOfClaim?.option !== RejectAllOfClaimType.COUNTER_CLAIM;
};

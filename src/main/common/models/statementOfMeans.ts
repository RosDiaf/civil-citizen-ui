import {Disability} from '../form/models/statementOfMeans/disability';
import {SevereDisability} from '../form/models/statementOfMeans/severeDisability';
import {Partner} from '../form/models/statementOfMeans/partner';
import {CitizenBankAccount} from './citizenBankAccount';
import {Cohabiting} from '../form/models/statementOfMeans/partner/cohabiting';
import {PartnerDisability} from '../form/models/statementOfMeans/partner/partnerDisability';
import {PartnerSevereDisability} from '../form/models/statementOfMeans/partner/partnerSevereDisability';
import {Residence} from '../form/models/statementOfMeans/residence';
import {Employment} from './employment';

export class StatementOfMeans {
  disability?: Disability;
  severeDisability?: SevereDisability;
  partnerAge?: Partner;
  bankAccounts?: CitizenBankAccount[];
  cohabiting?: Cohabiting;
  employment?: Employment;
  partnerDisability?: PartnerDisability;
  partnerSevereDisability?: PartnerSevereDisability;
  residence?: Residence;
}

import * as express from 'express';

import { AbstractPaymentPlanPage } from 'shared/components/payment-intention/payment-plan';
import { AbstractModelAccessor } from 'shared/components/model-accessor';
import { PaymentIntention } from 'shared/components/payment-intention/model/paymentIntention';

import { Draft } from '@hmcts/draft-store-client';
import { ResponseDraft } from 'response/draft/responseDraft';
import { CalculateMonthlyIncomeExpense } from 'common/calculate-monthly-income-expense/calculateMonthlyIncomeExpense';
import { IncomeExpenseSources } from 'common/calculate-monthly-income-expense/incomeExpenseSources';

import { Paths, fullAdmissionPath } from 'response/paths';

class ModelAccessor extends AbstractModelAccessor<ResponseDraft, PaymentIntention> {
  get(draft: ResponseDraft): PaymentIntention {
    return draft.fullAdmission.paymentIntention;
  }

  set(draft: ResponseDraft, model: PaymentIntention): void {
    draft.fullAdmission.paymentIntention = model;
  }
}

class PaymentPlanPage extends AbstractPaymentPlanPage<ResponseDraft> {
  getHeading(): string {
    return 'Your repayment plan';
  }

  createModelAccessor(): AbstractModelAccessor<ResponseDraft, PaymentIntention> {
    return new ModelAccessor();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  buildPostSubmissionUri(req: express.Request, res: express.Response): string {
    const { externalId } = req.params;
    return Paths.taskListPage.evaluateUri({ externalId });
  }
}

/* tslint:disable:no-default-export */
export default new PaymentPlanPage()
  .buildRouter(fullAdmissionPath,
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const draft: Draft<ResponseDraft> = res.locals.draft;

      res.locals.monthlyIncomeAmount = draft.document.statementOfMeans ? CalculateMonthlyIncomeExpense.calculateTotalAmount(
        IncomeExpenseSources.fromMonthlyIncomeFormModel(draft.document.statementOfMeans.monthlyIncome).incomeExpenseSources,
      ) : 0;
      res.locals.monthlyExpensesAmount = draft.document.statementOfMeans ? CalculateMonthlyIncomeExpense.calculateTotalAmount(
        IncomeExpenseSources.fromMonthlyExpensesFormModel(draft.document.statementOfMeans.monthlyExpenses).incomeExpenseSources,
      ) : 0;
      next();
    },
  );

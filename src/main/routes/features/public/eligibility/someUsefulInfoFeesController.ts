import * as express from 'express';
import {
  ELIGIBILITY_INFORMATION_FEES_URL,
  ELIGIBILITY_APPLY_HELP_FEES_URL,
  ELIGIBILITY_HELP_WITH_FEES,
} from '../../../../routes/urls';
import {GenericForm} from '../../../../common/form/models/genericForm';
import {GenericYesNo} from '../../../../common/form/models/genericYesNo';
import {YesNo} from '../../../../common/form/models/yesNo';

const someUsefulInfoFeesController = express.Router();
const someUsefulInfoFeesViewPath = 'features/public/eligibility/some-useful-info-fees';

function renderView(genericYesNoForm: GenericForm<GenericYesNo>, res: express.Response): void {
  const form = Object.assign(genericYesNoForm);
  form.option = genericYesNoForm.model.option;
  res.render(someUsefulInfoFeesViewPath, {form});
}

someUsefulInfoFeesController.get(ELIGIBILITY_INFORMATION_FEES_URL, (req, res) => {
  const cookie = req.cookies['eligibility'] ? req.cookies['eligibility'] : {};
  const someUsefulInfoFees = cookie?.someUsefulInfoFees;
  const genericYesNoForm = new GenericForm(new GenericYesNo(someUsefulInfoFees));
  renderView(genericYesNoForm, res);
});

someUsefulInfoFeesController.post(ELIGIBILITY_INFORMATION_FEES_URL, (req, res) => {
  const genericYesNoForm = new GenericForm(new GenericYesNo(req.body.option));
  genericYesNoForm.validateSync();
  if (genericYesNoForm.hasErrors()) {
    renderView(genericYesNoForm, res);
  } else {
    const cookie = req.cookies['eligibility'] ? req.cookies['eligibility'] : {};
    cookie.someUsefulInfoFees = genericYesNoForm.model.option;
    res.cookie('eligibility', cookie);
    genericYesNoForm.model.option === YesNo.YES
      ? res.redirect(ELIGIBILITY_APPLY_HELP_FEES_URL)
      : res.redirect(ELIGIBILITY_HELP_WITH_FEES);
  }
});

export default someUsefulInfoFeesController;

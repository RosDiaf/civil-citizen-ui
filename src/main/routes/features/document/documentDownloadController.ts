import * as express from 'express';
import config from 'config';
import {CASE_DOCUMENT_DOWNLOAD_URL} from '../../urls';
import {CivilServiceClient} from  '../../../app/client/civilServiceClient';
import * as documentUtils from '../../../common/utils/downloadUtils';
import {convertToDocumentType} from '../../../common/utils/documentTypeConverter';
import {AppRequest} from '../../../common/models/AppRequest';
import {DocumentType} from '../../../common/models/document/documentType';
import {Claim} from 'models/claim';
import {getClaimById} from '../../../modules/utilityService';

const documentDownloadController = express.Router();
const civilServiceApiBaseUrl = config.get<string>('services.civilService.url');
const civilServiceClient = new CivilServiceClient(civilServiceApiBaseUrl, true);

documentDownloadController.get(CASE_DOCUMENT_DOWNLOAD_URL, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const claim: Claim = await getClaimById(req.params.id, req);
    const documentType = convertToDocumentType(req.params.documentType);
    const documentDetails = claim.getDocumentDetails(DocumentType[documentType]);
    const pdfDocument: Buffer = await civilServiceClient.retrieveDocument(documentDetails, <AppRequest>req);
    documentUtils.downloadPDF(res, pdfDocument, documentDetails.documentName);
  } catch (error) {
    next(error);
  }
});

export default documentDownloadController;

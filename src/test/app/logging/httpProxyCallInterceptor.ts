/* tslint:disable:no-unused-expression */
import chai from 'chai';
import sinon from 'sinon';
import spies from 'sinon-chai';
import { CallHandler, HttpMethods, HttpProxyCallInterceptor } from 'logging/httpProxyCallInterceptor';

chai.use(spies);
const expect = chai.expect;

describe('HttpProxyCallInterceptor', () => {
  describe('intercept', () => {
    const callHandler: CallHandler = (target: Object, key: string, callArgs: any[]): void => {
      callArgs[0] = 123;
      callArgs[1] = '456';
      callArgs[2] = [789];
    };

    context('when calling HTTP methods', () => {
      const service = {};

      HttpMethods.forEach((httpMethod) => {
        it(`should apply provided call handler when calling ${httpMethod} HTTP method`, () => {
          service[httpMethod] = sinon.stub();
          const interceptedFunction = HttpProxyCallInterceptor.intercept(service, httpMethod, callHandler);
          interceptedFunction();
          expect(service[httpMethod]).to.have.been.calledWith(123, '456', [789]);
        });
      });
    });

    describe('when calling non-HTTP methods', () => {
      const service = {
        someMethod: sinon.stub(),
      };

      it('should not apply the call handler when not calling a HTTP method', () => {
        const interceptedFunction = HttpProxyCallInterceptor.intercept(service, 'someMethod', callHandler);
        interceptedFunction('this should not be modified');
        expect(service.someMethod).to.have.been.calledWith('this should not be modified');
      });
    });
  });
});

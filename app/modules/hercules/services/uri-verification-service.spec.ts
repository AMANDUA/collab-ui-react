describe('URI Verification Service', () => {

    beforeEach(angular.mock.module('Hercules'));

    let service;

    let dvList = [{
        text: 'pendingdomain.com',
        status: 'pending',
    }, {
        text: 'validdomain.com',
        status: 'verified',
    }, {
        text: 'validsubdomain.unverified.com',
        status: 'verified',
    }, {
        text: 'claimeddomain.com',
        status: 'claimed',
    }];

    beforeEach(angular.mock.module(($provide) => {
        $provide.value('DomainManagementService', {
            getVerifiedDomains: () => {
                return null;
            },
            domainList: dvList,
            states: {
                pending: 'pending',
                verified: 'verified',
                claimed: 'claimed',
            },
        });
    }));

    beforeEach(inject((UriVerificationService) => {
        service = UriVerificationService;
    }));

    it('should return false for invalid uris',  () => {
        expect(service.isDomainVerified(dvList)).toBe(false);
        expect(service.isDomainVerified(dvList, null)).toBe(false);
        expect(service.isDomainVerified(dvList, '')).toBe(false);
        expect(service.isDomainVerified(dvList, '..')).toBe(false);
        expect(service.isDomainVerified(dvList, 'valid@')).toBe(false);
    });

    it('should return false for valid non-verified domain',  () => {

        expect(service.isDomainVerified(dvList, 'nonVerifiedDomain.com')).toBe(false); //nonVerifiedDomain.com
        expect(service.isDomainVerified(dvList, 'hostname.nonVerifiedDomain.com')).toBe(false); //hostname.nonVerifiedDomain.com
        expect(service.isDomainVerified(dvList, 'invalid@nonVerifiedDomain.com')).toBe(false); //nonVerifiedDomain.com
        expect(service.isDomainVerified(dvList, 'invalid@hostname.nonVerifiedDomain.com')).toBe(false); //hostname.nonVerifiedDomain.com
        expect(service.isDomainVerified(dvList, 'invalid@ho@nonVerifiedDomain.com')).toBe(false); //nonVerifiedDomain.com
        expect(service.isDomainVerified(dvList, 'invalid@ho@hostname.nonVerifiedDomain.com')).toBe(false); //hostname.nonVerifiedDomain.com
        expect(service.isDomainVerified(dvList, 'user@invalidDomain.com')).toBe(false);
        expect(service.isDomainVerified(dvList, 'validDomain.nonVerifiedDomain.com')).toBe(false);
        expect(service.isDomainVerified(dvList, 'validDomain')).toBe(false);
        expect(service.isDomainVerified(dvList, 'invalidDomain.com')).toBe(false);
        expect(service.isDomainVerified(dvList, 'almostvalidDomain.com')).toBe(false);

        expect(service.isDomainVerified(dvList, 'validsubdomain.com')).toBe(false); //validDomain.com
        expect(service.isDomainVerified(dvList, 'toplevel.validsubdomain.something.unverified.com')).toBe(false); //validDomain.com
        expect(service.isDomainVerified(dvList, 'user@validsubdomain2.unverified.com')).toBe(false); //validDomain.com
        expect(service.isDomainVerified(dvList, 'user2@toplevel.validsubdomain2.unverified.com')).toBe(false); //validDomain.com

    });

    it('should return true for valid verified domains',  () => {

        expect(service.isDomainVerified(dvList, 'validDomain.com')).toBe(true); //validDomain.com
        expect(service.isDomainVerified(dvList, 'VALIDDOMAIN.com')).toBe(true); //validDomain.com
        expect(service.isDomainVerified(dvList, 'user@VALIDDOMAIN.com')).toBe(true); //validDomain.com
        expect(service.isDomainVerified(dvList, 'hostname.validDomain.com')).toBe(true); //hostname.validDomain.com
        expect(service.isDomainVerified(dvList, 'invalid@validDomain.com')).toBe(true); //validDomain.com
        expect(service.isDomainVerified(dvList, 'invalid@hostname.validDomain.com')).toBe(true); //hostname.validDomain.com
        expect(service.isDomainVerified(dvList, 'invalid@ho@validDomain.com')).toBe(true); //validDomain.com
        expect(service.isDomainVerified(dvList, 'invalid@ho@hostname.validDomain.com')).toBe(true); //hostname.validDomain.com

        expect(service.isDomainVerified(dvList, 'validsubdomain.unverified.com')).toBe(true); //validDomain.com
        expect(service.isDomainVerified(dvList, 'toplevel.validsubdomain.unverified.com')).toBe(true); //validDomain.com
        expect(service.isDomainVerified(dvList, 'user@validsubdomain.unverified.com')).toBe(true); //validDomain.com
        expect(service.isDomainVerified(dvList, 'user2@toplevel.validsubdomain.unverified.com')).toBe(true); //validDomain.com
    });
});

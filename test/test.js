const expect = require('chai').expect;
var chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

require('dotenv').config();

const sleep = require("../utils.js").sleep
const find_hashes = require("../utils.js").find_hashes

const upload_file = require("../opswat_client.js").upload_file
const retrieve_scan_report_via_hashes = require("../opswat_client.js").retrieve_scan_report_via_hashes
const retrieve_scan_report_via_data_id = require("../opswat_client.js").retrieve_scan_report_via_data_id

const integration_tests = () => {

    console.log = function() {} //Supress console.log during testing

    it('File Upload with Wrong API Key', () => {
        
        var result = upload_file("./test/test.txt", "no-good-api-key");
        return expect(result).to.eventually.be.rejected;
    });

    it('File Upload with Incorrect File Path', () => {
        
        var result = upload_file("./test/incorrect_path.txt", process.env.APIKEY);
        return expect(result).to.eventually.be.rejected;
    });

    it('File Upload Returns Valid Data ID', () => {
        
        var result = upload_file("./test/test.txt", process.env.APIKEY);
        return result.then(res => {
            expect(res.data_id).to.not.be.undefined;
        })
    });

    it('Calculate Hash Failed due to Incorrect File Path', () => {
        
        var result = find_hashes("./test/incorrect_path.txt");
        return expect(result).to.eventually.be.rejected;

    });

    it('Calculate Hash Success', () => {
        
        var expected = {md5: '434A0445AF7B948F9561725612EAADA5', sha1: 'A81F148D36810081DED11807065168151601CE66', sha256: 'F401B57D568B6B081F3005E605A683EBD3C3546560FFC8D5F59B4FF5705DFBD7'};
  
        var result = find_hashes("./test/test.txt");
  
        return result.then(hashes => {
            expect(JSON.stringify(hashes)).to.equal(JSON.stringify(expected));
        });
    });
    
    it('Return Scan Results with Valid Hash', () => {
        const hashes = {md5: '434A0445AF7B948F9561725612EAADA5', sha1: 'A81F148D36810081DED11807065168151601CE66', sha256: 'F401B57D568B6B081F3005E605A683EBD3C3546560FFC8D5F59B4FF5705DFBD7'};

        var result = retrieve_scan_report_via_hashes(hashes, process.env.APIKEY);
        return expect(result).to.eventually.be.not.rejected;

    });

    it('Return Scan Results with Invalid Hash', () => {
        const hashes = {md5: 'An incorrect Hash', sha1: 'Another incorrect Hash', sha256: 'Another incorrect Hash'};

        var result = retrieve_scan_report_via_hashes(hashes, process.env.APIKEY);
        return expect(result).to.eventually.be.rejected;
    });

    it('Return Scan Results with Valid Hash but Invalid API Key', () => {
        const hashes = {md5: '434A0445AF7B948F9561725612EAADA5', sha1: 'A81F148D36810081DED11807065168151601CE66', sha256: 'F401B57D568B6B081F3005E605A683EBD3C3546560FFC8D5F59B4FF5705DFBD7'};

        var result = retrieve_scan_report_via_hashes(hashes, "no-good-api-key");
        return expect(result).to.eventually.be.rejected;
        
    });

    it('Return Scan Results with Valid Data ID', () => {
        upload_file("./test/test.txt", process.env.APIKEY).then(res => {
            var result = retrieve_scan_report_via_data_id(res.data_id, process.env.APIKEY);
            return expect(result).to.eventually.be.not.rejected;
        })
    });

    it('Return Scan Results with Invalid Data ID', () => {
        upload_file("./test/test.txt", process.env.APIKEY).then(res => {
            var result = retrieve_scan_report_via_data_id("An Invalid data_id", process.env.APIKEY).catch(error => {console.log(error.message)});
            return expect(result).to.eventually.be.rejected;
        })
    });

    it('Return Scan Results with Correct Data ID but Invalid API Key', () => {
        upload_file("./test/test.txt", process.env.APIKEY).then(res => {
            var result = retrieve_scan_report_via_data_id(res.data_id, "no-good-api-key").catch(error => {console.log(error.message)});
            return expect(result).to.eventually.be.rejected;
        })
    });

}
  
integration_tests()







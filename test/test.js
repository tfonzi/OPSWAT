const prompt = require('prompt-sync')();
const expect = require('chai').expect;
var chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);


require('dotenv').config();

const find_hashes = require("../controllers.js").find_hashes
const upload_file = require("../controllers.js").upload_file
const retrieve_scan_report_via_hashes = require("../controllers.js").retrieve_scan_report_via_hashes
const retrieve_scan_report_via_data_id = require("../controllers.js").retrieve_scan_report_via_data_id

const unit_tests = () => {

    it('Hash Return Failed due to Incorrect File Path', () => {
        
        var result = find_hashes("./test/incorrect_path.txt");
        return expect(result).to.eventually.be.rejected;

    });

    it('Hash Returned Successfully', () => {
        
        var expected = {md5: '434A0445AF7B948F9561725612EAADA5', sha1: 'A81F148D36810081DED11807065168151601CE66', sha256: 'F401B57D568B6B081F3005E605A683EBD3C3546560FFC8D5F59B4FF5705DFBD7'};
  
        var result = find_hashes("./test/test.txt");
  
        return result.then(hashes => {
            expect(JSON.stringify(hashes)).to.equal(JSON.stringify(expected));
        });
    });

    it('File Upload Wrong API Key', () => {
        
        var result = upload_file("./test/test.txt", "no-good-api-key");
        return expect(result).to.eventually.be.rejected;
    });

    it('File Upload Incorrect File Path', () => {
        
        var result = upload_file("./test/incorrect_path.txt", process.env.APIKEY);
        return expect(result).to.eventually.be.rejected;
    });

    it('File Upload Return Valid Data ID', () => {
        
        var result = upload_file("./test/test.txt", process.env.APIKEY);
        return result.then(res => {
            expect(res.data_id).to.not.be.undefined;
        })
    });




}
  
unit_tests()







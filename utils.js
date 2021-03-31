const fs = require('fs');
const hasha = require('hasha');
  
const sleep = (milliseconds) => {
    const start_date = Date.now();
    while((Date.now() - start_date) < milliseconds);
}
  
const find_hashes = async (filePath) => {
    
    if(!fs.existsSync(filePath)){ //Throw Error if file does not exist
        throw Error("Error: File does not Exist");
    }
    
    var hashes = {};
    hashes.md5 = await hasha.fromFile(filePath, {algorithm: 'md5'});
    hashes.sha1 = await hasha.fromFile(filePath, {algorithm: 'sha1'});
    hashes.sha256 = await hasha.fromFile(filePath, {algorithm: 'sha256'});
  
    //Convert to uppercase to match MetaDefender's hash format
    hashes.md5 = hashes.md5.toUpperCase();
    hashes.sha1 = hashes.sha1.toUpperCase();
    hashes.sha256 = hashes.sha256.toUpperCase();
  
    return hashes;
}
  
module.exports = {find_hashes};

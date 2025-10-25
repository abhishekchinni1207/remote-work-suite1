
const { setupWSConnection: originalSetup } = require('y-websocket/bin/utils'); 



module.exports = (Y_INSTANCE) => {
    
    return {
        setupWSConnection: originalSetup,
     
    };
};
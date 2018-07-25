function makePromise(data, error) {
  return new Promise((resolve, reject) => {
    if (data && !error) resolve(data);
    else reject(error);
  });
}

export default {
  stockQuery() {
    const data = [
      {
        code: 'xxx',
        market: 'xxx',
        name: 'xxx',
        stock_type: 'xxx',
        exchange_code: 'xxx',
        fav_flag: '1'
      }
    ];
    return makePromise(data);
  },
 
  close() {
    console.log('关闭webview');
  },
  getDeviceInfo() {
    const data = {
      data: {
        operationSystemType: '10.3.3',
        device: 'iPhone7,2',
        verifyCode: '',
        sdkVersion: '',
        deviceID: '9A7EAFD7-24C9-4A08-87CC-86A1CF59077F',
        softwareVersion: '6.6.0.0',
        phoneNo: '18612345678',
        op_station:
          '18612345678,6.6.0.0,iphone,9a7eafd7-24c9-4a08-87cc-86a1cf59077f,',
        software_type: '66063'
      }
    };
    return makePromise(data);
  }
};

// 本地错误码
export const Codes = {
  NetworkError: 101, // 网络错误（无网络）
  NetworkUnknownError: 102, // 未知网络错误
  RequestError: 103, // 网络请求非200错误
  JSONParseError: 104, // JSON解析失败
  ResponseEmptyError: 105, // 网络请求返回为空
  ResponseDecodeError: 106, // 网络请求回包解包失败

  JSBError: 201,
  JSBPortalError: 202,
  JSBTradeError: 203
};


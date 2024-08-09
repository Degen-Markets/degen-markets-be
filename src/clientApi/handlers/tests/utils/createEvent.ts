import { APIGatewayEvent } from "aws-lambda";
import { APIGatewayProxyEventQueryStringParameters } from "aws-lambda/trigger/api-gateway-proxy";

export const createApiGwEvent = <B extends {}>({
  body,
  path = "/",
  queryStringParameters = {},
}: {
  body?: B;
  path?: string;
  queryStringParameters?: APIGatewayProxyEventQueryStringParameters;
}): APIGatewayEvent =>
  ({
    version: "2.0",
    routeKey: "$default",
    rawPath: path,
    rawQueryString: "",
    queryStringParameters,
    headers: {
      "accept-encoding": "gzip,deflate",
      "cloudfront-forwarded-proto": "https",
      "cloudfront-is-android-viewer": "false",
      "cloudfront-is-desktop-viewer": "true",
      "cloudfront-is-ios-viewer": "false",
      "cloudfront-is-mobile-viewer": "false",
      "cloudfront-is-smarttv-viewer": "false",
      "cloudfront-is-tablet-viewer": "false",
      "cloudfront-viewer-address": "34.237.24.169:5401",
      "cloudfront-viewer-asn": "14618",
      "cloudfront-viewer-city": "Ashburn",
      "cloudfront-viewer-country": "US",
      "cloudfront-viewer-http-version": "1.1",
      "cloudfront-viewer-tls": "TLSv1.3:TLS_AES_128_GCM_SHA256:fullHandshake",
      "content-length": "1506",
      "content-type": "application/json; charset=utf-8",
      host: "6f63w5gcu9.execute-api.eu-west-1.amazonaws.com",
      traceparent: "00-b92282847bf57f60f896995de0cada3f-2bd0e876e3e250e7-01",
      "user-agent": "Apache-HttpClient/4.5.13 (Java/17.0.11)",
      via: "1.1 2a6e657acb4fd3f6aee2e3da45e44642.cloudfront.net (CloudFront)",
      "x-amz-cf-id": "N7bOY7JUJ68hYZ5O_zpAIdKqTgLFRYqWDIpbtTzGR_N7bMeImUEVHA==",
      "x-amzn-trace-id": "Root=1-662e464c-14d8f7ca40d447f13d78bbc7",
      "x-api-key":
        "8cff2566b2848e02cf71de3e270d122bcfadec1fdc28ffe0af7013aad408eb01",
      "x-forwarded-for": "34.237.24.169, 130.176.179.8",
      "x-forwarded-port": "443",
      "x-forwarded-proto": "https",
    },
    requestContext: {
      accountId: "211125555405",
      apiId: "6f63w5gcu9",
      domainName: "6f63w5gcu9.execute-api.eu-west-1.amazonaws.com",
      domainPrefix: "6f63w5gcu9",
      http: {
        method: "POST",
        path,
        protocol: "HTTP/1.1",
        sourceIp: "34.237.24.169",
        userAgent: "Apache-HttpClient/4.5.13 (Java/17.0.11)",
      },
      requestId: "W7_sAg1hjoEEPLw=",
      routeKey: "$default",
      stage: "$default",
      time: "28/Apr/2024:12:51:24 +0000",
      timeEpoch: 1714308684568,
    },
    body: body ? JSON.stringify(body) : "",
    isBase64Encoded: false,
  }) as unknown as APIGatewayEvent;

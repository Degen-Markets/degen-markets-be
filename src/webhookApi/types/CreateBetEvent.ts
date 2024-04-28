import {Address, Hex} from "viem";

export type CreateBetEvent = {
	"webhookId": string;
	"id": string;
	"createdAt": string;
	"type": "GRAPHQL";
	"event": {
		"data": {
			"block": {
				"logs": {
					"topics": Hex[];
					"transaction": {
						"hash": Hex;
						"from": {
							"address": Address;
						};
						"value": Hex;
						"status": 1 | 2; // 1 is "confirmed"
					};
				}[]
			};
		};
	};
}
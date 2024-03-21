export function getReadRequest(variableName: string): ReadRequest {
	return {
		method: "PlcProgram.Read",
		params: {
			mode: "simple",
			var: variableName,
		},
		jsonrpc: "2.0",
		id: variableName
	}
}

export function getWriteRequest(variableName: string, value: string | number | boolean): WriteRequest {
	return {
		method: "PlcProgram.Write",
		params: {
			mode: "simple",
			var: variableName,
			value
		},
		jsonrpc: "2.0",
		id: variableName
	}
}

export type RequestConfig = {
	protocol?: 'http' | 'https';
	timeout?: number;
}

export function login(ip: string, user: string, password: string, config?: RequestConfig): Promise<string> {
	const body = JSON.stringify({
		method: 'Api.Login',
		jsonrpc: '2.0',
		id: Math.random().toString(36).substring(5),
		params: {
			user,
			password,
		},
	});
	return fetch(`${config?.protocol || 'http'}://${ip}/api/jsonrpc`, {
		body,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': '*/*',
		},
		signal: AbortSignal.timeout(config?.timeout || 10000),
	}).then(res => res.json()).then((data?: { result?: { token?: string } }) => {
		if (data?.result?.token) return data.result.token;
		throw data;
	});
}

export function read(ip: string, token: string, body: ReadRequest[], config?: RequestConfig): Promise<CPUResult[]> {
	return fetch(`${config?.protocol || 'https'}://${ip}/api/jsonrpc`, {
		body: JSON.stringify(body),
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': '*/*',
			'X-Auth-Token': token
		},
		signal: AbortSignal.timeout(config?.timeout || 10000),
	}).then(res => {
		if (res.status != 200) throw res;
		return res.json();
	})
}

export function getReadRequests(variableNames: string[]): ReadRequest[] {
	return variableNames.map(variableName => getReadRequest(variableName))
}

export function getWriteRequests(variables: WriteRequestInput[]): WriteRequest[] {
	return variables.map(variable => getWriteRequest(variable.var, variable.value))
}

export function getResultValuesByEnum(results: CPUResult[], enums: any) {
	const result: Partial<Record<typeof enums, any>> = {};
	// @ts-ignore
	Object.values(enums).forEach(valueName => {
		const found = results.filter(setting => setting.id === valueName);
		if (found.length == 1 && found[0].result !== undefined) {
			// @ts-ignore
			result[valueName] = found[0].result;
		} else {
			console.warn(`Variable for ${valueName} not found in getResultValuesByEnum!`);
		}
	});
	return result;
}

export function getResultValuesByArray(results: CPUResult[], list: string[]) {
	const result: Partial<Record<string | number | symbol, any>> = {};
	list.forEach(valueName => {
		const found = results.filter(setting => setting.id === valueName);
		if (found.length == 1 && found[0].result !== undefined) {
			result[valueName] = found[0].result;
		} else {
			console.warn(`Variable for ${valueName} not found in getResultValuesByArray!`);
		}
	});
	return result;
}

// types
export type ReadRequest = {
	method: "PlcProgram.Read";
	params: {
		mode: "simple";
		var: string;
	},
	jsonrpc: "2.0",
	id: string;
}

export type WriteRequest = {
	method: "PlcProgram.Write";
	params: {
		mode: "simple";
		var: string;
		value: number | string | boolean;
	},
	jsonrpc: "2.0",
	id: string;
}

export type WriteRequestInput = {
	var: string;
	value: number | string | boolean;
};

export type CPUError = {
	code: number;
	message: string;
}

export type CPUResult = {
	id: string;
	result: boolean | string | number | undefined;
	error: CPUError | undefined;
}